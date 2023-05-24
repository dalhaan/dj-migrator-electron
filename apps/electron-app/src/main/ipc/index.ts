import { ipcMain } from "electron";

import { exportPlaylistsToRekordBoxXml } from "./dj-migrator/rekordbox";
import { findCrates, parseCrates } from "./dj-migrator/serato";
import {
  openDirectoryDialog,
  openSaveFileDialog,
  showMessageBox,
} from "./file-system";

export const IPC = {
  // Serato
  findCrates,
  parseCrates,

  // RekordBox,
  exportPlaylistsToRekordBoxXml,

  // File system
  showMessageBox,
  openDirectoryDialog,
  openSaveFileDialog,
};

export type IpcHandlers = typeof IPC;

export function initIpcHandlers() {
  for (const handler of Object.entries(IPC)) {
    const channel = handler[0];
    const listener = handler[1] as any;

    ipcMain.handle(channel, (event, ...args: any[]) => listener(...args));
  }
}
