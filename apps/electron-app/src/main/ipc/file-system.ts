import { SaveDialogOptions, dialog } from "electron";

export async function handleGetFilePathDialog(): Promise<string | undefined> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
  });

  if (!canceled) {
    return filePaths[0];
  }
}

export async function openSaveFileDialog(
  options?: SaveDialogOptions
): Promise<string | undefined> {
  const { canceled, filePath } = await dialog.showSaveDialog({
    ...options,
    properties: [...(options?.properties || []), "createDirectory"],
  });

  if (!canceled) {
    return filePath;
  }
}
