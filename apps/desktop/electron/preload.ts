import { contextBridge, ipcRenderer } from "electron";

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
});
