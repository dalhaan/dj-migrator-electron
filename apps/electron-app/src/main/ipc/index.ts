import { ipcMain } from "electron";

import { findCrates, parseCrates } from "./dj-migrator/serato";
import { openDirectoryDialog, showMessageBox } from "./file-system";

export const IPC = {
  // Serato
  findCrates,
  parseCrates,

  // File system
  showMessageBox,
  openDirectoryDialog,
};

export type IpcHandlers = typeof IPC;

export function initIpcHandlers() {
  for (const handler of Object.entries(IPC)) {
    const channel = handler[0];
    const listener = handler[1] as any;

    ipcMain.handle(channel, (event, ...args: any[]) => listener(...args));
  }
}
