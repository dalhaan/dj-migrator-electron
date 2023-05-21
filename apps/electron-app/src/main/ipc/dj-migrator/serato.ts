import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

import { IpcResponse, ipcResponse } from "@dj-migrator/common";
import { dialog } from "electron";

import { openDirectoryDialog, showMessageBox } from "../file-system";

export async function loadCrates(): Promise<IpcResponse<string[] | undefined>> {
  // Prompt for Serato directory (must contain "_Serato_" directory)
  const directoryPath = await openDirectoryDialog();

  if (!directoryPath) {
    return ipcResponse("DirectoryNotFound");
  }

  // Check if valid Serato directory
  const subcrateDir = path.resolve(directoryPath, "_Serato_", "Subcrates");
  const isValidDir = Boolean(subcrateDir && fs.existsSync(subcrateDir));

  if (!isValidDir) {
    const { response } = await dialog.showMessageBox({
      message: "Could not find crates",
      detail:
        'DJ Migrator could not find any crates in that directory.\n\nMake sure the directory has a "_Serato_" directory inside of it.',
      buttons: ["Try again", "Cancel"],
      cancelId: 1,
      defaultId: 0,
    });

    if (response === 0) {
      // Pressed "Try again"
      return loadCrates();
    } else {
      // Pressed "Cancel"
      return ipcResponse("success", undefined);
    }
  }

  // Get list of subcrate paths
  const subcratePaths = await fsPromises.readdir(subcrateDir);

  // Extract subcrate names
  const subcrates = subcratePaths
    .filter((subcrate) => path.extname(subcrate) === ".crate")
    .map((subcrate) => path.basename(subcrate, path.extname(subcrate)));

  return ipcResponse("success", subcrates);
}
