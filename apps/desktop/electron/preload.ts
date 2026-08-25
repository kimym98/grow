import { contextBridge, ipcRenderer } from "electron";

// 이후 작업(Task 010 알림 등)에서 확장될 IPC 브리지 골격
contextBridge.exposeInMainWorld("electronAPI", {
  ping: () => "pong",
  // grow:// 딥링크로 수신한 Supabase OAuth 콜백 URL을 렌더러로 전달
  onAuthCallback: (callback: (url: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, url: string) =>
      callback(url);
    ipcRenderer.on("auth-callback", listener);
    return () => ipcRenderer.removeListener("auth-callback", listener);
  },
});
