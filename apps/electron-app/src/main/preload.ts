import { Crate } from "@dj-migrator/common";
import { MessageBoxOptions, contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
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

  // IPC one-way main -> renderer events
  onWindowVisiblityChange: (callback: (value: "focus" | "blur") => void) =>
    ipcRenderer.on("visibilityChange", (_, value) => callback(value)),

  onStoreChange: (name: string, callback: (libraryState: any) => void) => {
    console.log("onStoreChange", name);
    ipcRenderer.on(`SYNCSTORE:${name}:ONCHANGE`, (_, libraryState) =>
      callback(libraryState)
    );
  },
  updateStore: (name: string, state: any) => {
    console.log("updateStore", name);
    ipcRenderer.send(`SYNCSTORE:${name}:UPDATE`, state);
  },
});
