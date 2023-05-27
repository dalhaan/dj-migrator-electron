import { parseWaveformData } from "@dj-migrator/node";

import { getFilePathDialog } from "./file-system";

export async function getWaveformData(): Promise<number[] | undefined> {
  const filePath = await getFilePathDialog();

  if (!filePath) return;

  return parseWaveformData(filePath);
}
