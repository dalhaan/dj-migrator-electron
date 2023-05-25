import type { IpcHandlers } from "../main/ipc";

declare global {
  interface Window {
    electronAPI: // IPC invoke handler types
    IpcHandlers & {
      // Window events
      openImportWindow: () => void;

      // IPC one-way listener types
      onWindowVisiblityChange: (
        callback: (value: "focus" | "blur") => void
      ) => void;

      getStore: (name: string) => void;
      onStoreChange: (
        name: string,
        callback: (libraryState: any) => void
      ) => void;
      updateStore: (name: string, state: any) => void;
    };
  }
}

export {};
