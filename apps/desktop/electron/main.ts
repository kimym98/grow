import {
  app,
  BrowserWindow,
  ipcMain,
  Notification,
  Tray,
  Menu,
  nativeImage,
  protocol,
  shell,
} from "electron";
import path from "path";
import { readFile } from "fs/promises";
import nodeSchedule from "node-schedule";
import { autoUpdater } from "electron-updater";

import {
  shouldTriggerDailySummary,
  shouldTriggerReminder,
  type MainProcessSchedule,
} from "./notification-trigger";

const AUTH_PROTOCOL = "grow";
// Next.js 정적 export 산출물을 file://로 직접 열면, 클라이언트 라우팅이 절대경로("/login" 등)를
// 브라우저 네비게이션으로 폴백할 때 그 경로가 "도메인 루트"가 아니라 "드라이브 루트"(file:///C:/login/)로
// 해석되어 ERR_FILE_NOT_FOUND가 발생한다. 커스텀 프로토콜로 서빙하면 "app://app"이 정식 origin이 되어
// 절대경로가 앱 루트 기준으로 정상 해석된다. registerSchemesAsPrivileged는 app이 ready 되기 전에
// 호출해야 하므로 모듈 최상단에서 실행한다.
const APP_PROTOCOL = "app";
protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_PROTOCOL,
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
  },
]);

/**
 * SENTRY_DSN이 설정된 경우에만 크래시/에러 수집을 초기화한다. 이 환경(및 대부분의 배포 초기 단계)에는
 * DSN이 발급되어 있지 않으므로 미설정 시 완전히 no-op으로 동작해야 하며, 어떤 예외도 앱 시작을 막으면 안 된다.
 * @sentry/electron/main은 DSN이 있을 때만 require한다 — 정적으로 import하면 모노레포 hoisting 구조상
 * 패키징에서 누락되기 쉬운 전이 의존성(@sentry/browser-utils)까지 항상 로드를 시도해 크래시 위험이 생긴다.
 */
function initSentryIfConfigured() {
  if (!process.env.SENTRY_DSN) return;

  try {
    const { init: initSentryMain } = require("@sentry/electron/main");
    initSentryMain({ dsn: process.env.SENTRY_DSN });
  } catch (error) {
    console.error("[sentry] 초기화 실패(앱 실행에는 영향 없음):", error);
  }
}

initSentryIfConfigured();

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
// 창을 닫아도 백그라운드(트레이)에 남아있을지 여부. 기본 false로 기존 동작(비-macOS는 창 닫으면 종료)을 보존한다
let keepInTrayEnabled = false;

interface NotificationSettingsValue {
  dailySummaryEnabled: boolean;
  dailySummaryTime: string;
  scheduledAlertEnabled: boolean;
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsValue = {
  dailySummaryEnabled: true,
  dailySummaryTime: "09:00",
  scheduledAlertEnabled: true,
};

// 렌더러가 IPC로 push한 최신 상태 캐시 (메인 프로세스는 Supabase 인증 정보가 없어 직접 조회 불가)
let cachedSchedules: MainProcessSchedule[] = [];
let cachedSettings: NotificationSettingsValue = DEFAULT_NOTIFICATION_SETTINGS;

// 동일 일정에 중복 알림을 보내지 않기 위한 발송 기록 (`${scheduleId}:${yyyy-mm-dd}`), 앱 재시작 시 초기화되는 정도로 충분
const firedReminderKeys = new Set<string>();
let lastSummaryAt: Date | undefined;

function parseSummaryTime(value: string): { hour: number; minute: number } {
  const [hour, minute] = value.split(":").map(Number);
  return { hour: hour || 0, minute: minute || 0 };
}

function registerNotificationHandlers() {
  ipcMain.on("sync-schedules", (_event, schedules: MainProcessSchedule[]) => {
    cachedSchedules = schedules;
  });

  ipcMain.on(
    "sync-notification-settings",
    (_event, settings: NotificationSettingsValue) => {
      cachedSettings = settings;
    }
  );

  nodeSchedule.scheduleJob("* * * * *", () => {
    const now = new Date();

    if (cachedSettings.scheduledAlertEnabled) {
      for (const item of cachedSchedules) {
        const key = `${item.id}:${now.toDateString()}`;
        if (!firedReminderKeys.has(key) && shouldTriggerReminder(item, now)) {
          new Notification({ title: item.title, body: item.memo ?? "일정 알림" }).show();
          firedReminderKeys.add(key);
        }
      }
    }

    if (
      cachedSettings.dailySummaryEnabled &&
      shouldTriggerDailySummary(now, lastSummaryAt, parseSummaryTime(cachedSettings.dailySummaryTime))
    ) {
      const todayStr = now.toISOString().slice(0, 10);
      const todayCount = cachedSchedules.filter((item) => item.date === todayStr).length;
      new Notification({
        title: "오늘의 일정",
        body: `${todayCount}건의 일정이 있습니다`,
      }).show();
      lastSummaryAt = now;
    }
  });
}

function registerCollectionNotificationHandlers() {
  ipcMain.on(
    "show-collection-notification",
    (_event, payload: { title: string; body: string }) => {
      console.log("[collection-notification] showing:", payload.title, payload.body);
      new Notification({ title: payload.title, body: payload.body }).show();
    }
  );
}

/**
 * electron-builder publish(GitHub Releases)로 배포된 신규 버전을 확인하고, 있으면 자동으로 다운로드한다.
 * 개발 모드에서는 배포된 릴리스가 없어 업데이트 없음/네트워크 오류로 끝나는 것이 정상이며,
 * macOS는 코드 서명이 없으면 자동 업데이트 자체가 동작하지 않는다(docs/task015-research.md 참고).
 * Windows는 verifyUpdateCodeSignature를 false로 설정해 서명 없이도 설치가 진행되도록 했다.
 */
function registerAutoUpdateHandlers() {
  autoUpdater.on("update-available", (info) => {
    console.log("[auto-update] 업데이트 발견:", info.version);
    new Notification({
      title: "업데이트 다운로드 중",
      body: `새 버전 ${info.version}을 다운로드하고 있습니다`,
    }).show();
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("[auto-update] 다운로드 완료:", info.version);
    new Notification({
      title: "업데이트 준비 완료",
      body: "앱을 재시작하면 새 버전이 적용됩니다",
    }).show();
  });

  autoUpdater.on("error", (error) => {
    console.error("[auto-update] 오류:", error.message);
  });

  autoUpdater.checkForUpdatesAndNotify().catch((error) => {
    console.error("[auto-update] 업데이트 확인 실패:", error.message);
  });
}

const APP_ICON_PATH = path.join(__dirname, "icon.png");

function createTrayIcon() {
  return nativeImage.createFromPath(APP_ICON_PATH).resize({ width: 16, height: 16 });
}

function ensureTray() {
  if (tray) return;

  tray = new Tray(createTrayIcon());
  tray.setToolTip("Grow");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "열기",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          } else {
            createWindow();
          }
        },
      },
      { label: "종료", click: () => app.quit() },
    ])
  );
  tray.on("click", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });
}

function destroyTray() {
  tray?.destroy();
  tray = null;
}

function registerLoginItemHandlers() {
  ipcMain.on("set-login-item-enabled", (_event, enabled: boolean) => {
    app.setLoginItemSettings({ openAtLogin: enabled });
  });

  ipcMain.handle("get-login-item-enabled", () => app.getLoginItemSettings().openAtLogin);
}

function registerTrayHandlers() {
  ipcMain.on("set-tray-enabled", (_event, enabled: boolean) => {
    keepInTrayEnabled = enabled;
    if (enabled) ensureTray();
    else destroyTray();
  });
}

function sendAuthCallback(url: string) {
  console.log("[auth-callback] received deep link:", url);
  mainWindow?.webContents.send("auth-callback", url);
}

function findAuthCallbackUrl(argv: string[]) {
  return argv.find((arg) => arg.startsWith(`${AUTH_PROTOCOL}://`));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: APP_ICON_PATH,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow = win;

  win.on("closed", () => {
    mainWindow = null;
  });

  // Supabase OAuth(signInWithOAuth)는 브라우저 환경에서 window.location으로 인증 URL을
  // 직접 네비게이션한다. 별도 처리가 없으면 앱 창 자체가 accounts.google.com으로 이동했다가
  // grow:// 딥링크 콜백(앱이 서빙하지 않는 프로토콜)으로 리다이렉트되며 흰 화면으로 끝난다.
  // app:// origin을 벗어나는 네비게이션/새 창 요청은 모두 OS 기본 브라우저로 열도록 가로챈다.
  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(`${APP_PROTOCOL}://`)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`${APP_PROTOCOL}://`)) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  const devUrl = "http://localhost:3000";
  win.loadURL(
    process.env.NODE_ENV === "development" ? devUrl : `${APP_PROTOCOL}://app/`
  );
}

/**
 * 정적 export 산출물(out/)을 app:// 커스텀 프로토콜로 서빙한다. file://로 직접 열면 클라이언트
 * 라우팅의 절대경로가 드라이브 루트로 잘못 해석되는 문제가 있어(위 registerSchemesAsPrivileged 주석 참고),
 * 정식 origin을 갖는 커스텀 프로토콜을 통해 서빙해 절대경로가 앱 루트 기준으로 해석되게 한다.
 */
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function registerAppProtocol() {
  protocol.handle(APP_PROTOCOL, async (request) => {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "" || pathname.endsWith("/")) {
      pathname += "index.html";
    }
    // out/ 산출물은 app.asar 안에 있어 일반 file:// 요청(net.fetch)으로는 asar 가상 경로를
    // 읽을 수 없다. asar를 투명하게 처리하는 Node의 fs로 직접 읽어 Response를 만들어 반환한다.
    const filePath = path.join(__dirname, "../../out", pathname);
    try {
      const data = await readFile(filePath);
      const contentType = MIME_TYPES[path.extname(filePath)] ?? "application/octet-stream";
      return new Response(data, { headers: { "content-type": contentType } });
    } catch {
      return new Response("Not Found", { status: 404 });
    }
  });
}

// grow:// 딥링크로 Supabase OAuth 콜백을 수신하기 위한 기본 프로토콜 핸들러 등록
app.setAsDefaultProtocolClient(AUTH_PROTOCOL);

// Windows/Linux는 딥링크가 두 번째 프로세스의 인자로 전달되므로 단일 인스턴스 락 필요
const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    const callbackUrl = findAuthCallbackUrl(argv);
    if (callbackUrl) {
      sendAuthCallback(callbackUrl);
    }
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // macOS는 open-url 이벤트로 딥링크를 전달
  app.on("open-url", (event, url) => {
    event.preventDefault();
    sendAuthCallback(url);
  });

  app.whenReady().then(() => {
    registerAppProtocol();
    createWindow();
    registerNotificationHandlers();
    registerCollectionNotificationHandlers();
    registerAutoUpdateHandlers();
    registerLoginItemHandlers();
    registerTrayHandlers();

    const callbackUrl = findAuthCallbackUrl(process.argv);
    if (callbackUrl) {
      sendAuthCallback(callbackUrl);
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    // 트레이 유지 옵션이 꺼져 있으면 기존 동작(비-macOS는 창을 닫으면 앱 종료)을 그대로 보존한다
    if (keepInTrayEnabled) return;
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
