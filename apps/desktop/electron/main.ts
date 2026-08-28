import { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage } from "electron";
import path from "path";
import nodeSchedule from "node-schedule";
import { autoUpdater } from "electron-updater";

import {
  shouldTriggerDailySummary,
  shouldTriggerReminder,
  type MainProcessSchedule,
} from "./notification-trigger";

const AUTH_PROTOCOL = "grow";

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

/** 프로젝트에 아이콘 이미지 자산이 없어, 트레이 표시용 단색 16x16 아이콘을 런타임에 raw RGBA 버퍼로 생성한다 */
function createTrayIcon() {
  const size = 16;
  const buffer = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i += 1) {
    buffer[i * 4] = 79; // R
    buffer[i * 4 + 1] = 70; // G
    buffer[i * 4 + 2] = 229; // B (indigo 계열)
    buffer[i * 4 + 3] = 255; // A
  }
  return nativeImage.createFromBuffer(buffer, { width: size, height: size });
}

function ensureTray() {
  if (tray) return;

  tray = new Tray(createTrayIcon());
  tray.setToolTip("AI 취업 비서");
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

  const devUrl = "http://localhost:3000";
  win.loadURL(
    process.env.NODE_ENV === "development"
      ? devUrl
      : `file://${path.join(__dirname, "../out/index.html")}`
  );
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
