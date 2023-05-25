import { Crate } from "@dj-migrator/common";
import { MessageBoxOptions, contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // Window events
  openImportWindow: () => {
    ipcRenderer.send("OPEN_IMPORT_WINDOW");
  },

  // Serato events
  findCrates: (directory: string) =>
    ipcRenderer.invoke("findCrates", directory),
  parseCrates: (directory: string, crates: Crate[]) =>
    ipcRenderer.invoke("parseCrates", directory, crates),

  // Rekordbox events
  exportPlaylistsToRekordBoxXml: (...args: any) =>
    ipcRenderer.invoke("exportPlaylistsToRekordBoxXml", ...args),

  // File system events
  showMessageBox: (options: MessageBoxOptions) =>
    ipcRenderer.invoke("showMessageBox", options),
  openDirectoryDialog: () => ipcRenderer.invoke("openDirectoryDialog"),
  openSaveFileDialog: (...args: any) =>
    ipcRenderer.invoke("openSaveFileDialog", ...args),

  // IPC one-way main -> renderer events
  onWindowVisiblityChange: (callback: (value: "focus" | "blur") => void) =>
    ipcRenderer.on("visibilityChange", (_, value) => callback(value)),

  getStore: (name: string) => {
    ipcRenderer.send(`SYNCSTORE:${name}:GET`);
  },
  onStoreChange: (name: string, callback: (libraryState: any) => void) => {
    ipcRenderer.on(`SYNCSTORE:${name}:ONCHANGE`, (_, libraryState) =>
      callback(libraryState)
    );
  },
  updateStore: (name: string, state: any) => {
    ipcRenderer.send(`SYNCSTORE:${name}:UPDATE`, state);
  },
});
