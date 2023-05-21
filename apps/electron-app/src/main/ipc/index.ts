import { ipcMain } from "electron";

import { loadCrates } from "./dj-migrator/serato";
import { showMessageBox } from "./file-system";

export const IPC = {
  // Serato
  loadCrates,

  // File system
  showMessageBox,
};

export type IpcHandlers = typeof IPC;

export function initIpcHandlers() {
  for (const handler of Object.entries(IPC)) {
    const channel = handler[0];
    const listener = handler[1] as any;

    ipcMain.handle(channel, (event, ...args: any[]) => listener(...args));
  }
}
