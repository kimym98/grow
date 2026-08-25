import { app, BrowserWindow } from "electron";
import path from "path";

const AUTH_PROTOCOL = "grow";

let mainWindow: BrowserWindow | null = null;

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
