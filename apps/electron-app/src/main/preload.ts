import { MessageBoxOptions, contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // Serato events
  loadCrates: () => ipcRenderer.invoke("loadCrates"),

  // File system events
  showMessageBox: (options: MessageBoxOptions) =>
    ipcRenderer.invoke("showMessageBox", options),

  // IPC one-way main -> renderer events
  onWindowVisiblityChange: (callback: (value: "focus" | "blur") => void) =>
    ipcRenderer.on("visibilityChange", (_, value) => callback(value)),
});
