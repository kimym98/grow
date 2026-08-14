import { contextBridge } from "electron";

// 이후 작업(Task 010 알림 등)에서 확장될 IPC 브리지 골격
contextBridge.exposeInMainWorld("electronAPI", {
  ping: () => "pong",
});
