import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // IPC one-way functions
  onWindowVisiblityChange: (callback: (value: "focus" | "blur") => void) =>
    ipcRenderer.on("visibilityChange", (_, value) => callback(value)),
});
