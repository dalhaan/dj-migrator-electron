import fs from "fs/promises";
import { WaveformReader } from "./reader";

export async function parseWaveformData(filePath: string): Promise<number[]> {
  const file = await fs.readFile(filePath);

  const reader = new WaveformReader(file);

  const result: number[] = [];

  let pcmValue = reader.read();

  while (pcmValue !== null) {
    // Do something with PCM values
    result.push(pcmValue);

    pcmValue = reader.read();
  }

  return result;
}
