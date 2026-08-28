import { contextBridge, ipcRenderer } from "electron";

// Sentry가 main<->renderer IPC 채널을 구성한다. 정적으로 import하면 전이 의존성(@sentry/browser-utils)이
// 모노레포 hoisting 구조상 패키징에서 누락됐을 때 preload 스크립트 전체가 로드에 실패해
// contextBridge 등록조차 안 되는 심각한 실패 모드가 생긴다. SENTRY_DSN 미설정 시에는 애초에
// 필요 없으므로, 실패해도 무시 가능하도록 감싸서 로드한다.
try {
  require("@sentry/electron/preload");
} catch (error) {
  console.error("[sentry] preload 브리지 로드 실패(무시 가능):", error);
}

contextBridge.exposeInMainWorld("electronAPI", {
  ping: () => "pong",
  // grow:// 딥링크로 수신한 Supabase OAuth 콜백 URL을 렌더러로 전달
  onAuthCallback: (callback: (url: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, url: string) =>
      callback(url);
    ipcRenderer.on("auth-callback", listener);
    return () => ipcRenderer.removeListener("auth-callback", listener);
  },
  // 렌더러가 로그인 세션에서 조회한 최신 일정을 메인 프로세스에 push (메인은 Supabase 인증 정보가 없음)
  syncSchedules: (schedules: unknown) => {
    ipcRenderer.send("sync-schedules", schedules);
  },
  // 렌더러(localStorage)에 저장된 알림 설정을 메인 프로세스에 push
  syncNotificationSettings: (settings: unknown) => {
    ipcRenderer.send("sync-notification-settings", settings);
  },
  // Supabase Realtime으로 감지한 신규 공고/뉴스 수집 완료를 OS 알림으로 표시 요청
  showCollectionNotification: (title: string, body: string) => {
    ipcRenderer.send("show-collection-notification", { title, body });
  },
  // OS 로그인 시 앱을 자동 실행할지 설정한다
  setLoginItemEnabled: (enabled: boolean) => {
    ipcRenderer.send("set-login-item-enabled", enabled);
  },
  // 현재 OS 로그인 자동 실행 설정 여부를 조회한다
  getLoginItemEnabled: () => ipcRenderer.invoke("get-login-item-enabled") as Promise<boolean>,
  // 창을 닫아도 트레이 아이콘으로 백그라운드에 남아있을지 설정한다
  setTrayEnabled: (enabled: boolean) => {
    ipcRenderer.send("set-tray-enabled", enabled);
  },
});
