import { app, BrowserWindow, ipcMain, Notification } from "electron";
import path from "path";
import nodeSchedule from "node-schedule";

import {
  shouldTriggerDailySummary,
  shouldTriggerReminder,
  type MainProcessSchedule,
} from "./notification-trigger";

const AUTH_PROTOCOL = "grow";

let mainWindow: BrowserWindow | null = null;

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
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
