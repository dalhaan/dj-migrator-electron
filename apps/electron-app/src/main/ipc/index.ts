import { ipcMain } from "electron";

export const IPC = {};

export type IpcHandlers = typeof IPC;

export function initIpcHandlers() {
  for (const handler of Object.entries(IPC)) {
    const channel = handler[0];
    const listener = handler[1] as any;

    ipcMain.handle(channel, (event, ...args: any[]) => listener(...args));
  }
}
