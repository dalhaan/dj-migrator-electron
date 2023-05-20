import type { IpcHandlers } from "../main/ipc";

declare global {
  interface Window {
    electronAPI: // IPC invoke handler types
    IpcHandlers & {
      // IPC one-way listener types
      onWindowVisiblityChange: (
        callback: (value: "focus" | "blur") => void
      ) => void;
    };
  }
}

export {};
