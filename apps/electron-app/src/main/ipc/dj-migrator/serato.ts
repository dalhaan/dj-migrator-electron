import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

import {
  Crate,
  ILibraryData,
  IpcResponse,
  ipcResponse,
} from "@dj-migrator/common";
import { SeratoParser } from "@dj-migrator/node";
import { dialog } from "electron";

import { openDirectoryDialog } from "../file-system";

export async function loadCrates(): Promise<
  IpcResponse<ILibraryData | undefined>
> {
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

  const libraryData = await SeratoParser.convertFromSerato({
    seratoDir: directoryPath,
  });

  return ipcResponse("success", libraryData);

  // // Get list of subcrate paths
  // const subcratePaths = await fsPromises.readdir(subcrateDir);

  // // Extract subcrate names
  // const subcrates = subcratePaths
  //   .filter((subcrate) => path.extname(subcrate) === ".crate")
  //   .map((subcrate) => {
  //     const crateName = path.basename(subcrate, path.extname(subcrate));

  //     return {
  //       filePath: subcrate,
  //       crateName,
  //     };
  //   });

  // return ipcResponse("success", subcrates);
}
