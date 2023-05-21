import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

import { IpcResponse, ipcResponse } from "@dj-migrator/common";

import { openDirectoryDialog } from "../file-system";

export async function loadCrates(): Promise<IpcResponse<string[]>> {
  // Prompt for Serato directory (must contain "_Serato_" directory)
  const directoryPath = await openDirectoryDialog();

  if (!directoryPath) {
    return ipcResponse("DirectoryNotFound");
  }

  // Check if valid Serato directory
  const subcrateDir = path.resolve(directoryPath, "_Serato_", "Subcrates");
  const isValidDir = Boolean(subcrateDir && fs.existsSync(subcrateDir));

  if (!isValidDir) {
    return ipcResponse("InvalidSeratoDirError", "Invalid Serato directory");
  }

  // Get list of subcrate paths
  const subcratePaths = await fsPromises.readdir(subcrateDir);

  // Extract subcrate names
  const subcrates = subcratePaths
    .filter((subcrate) => path.extname(subcrate) === ".crate")
    .map((subcrate) => path.basename(subcrate, path.extname(subcrate)));

  return ipcResponse("success", subcrates);
}
