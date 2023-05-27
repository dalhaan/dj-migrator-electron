import fs from "fs/promises";
import { WaveformReader } from "./reader";

export async function parseWaveformData(buffer: Buffer): Promise<number[]> {
  const reader = new WaveformReader(buffer);

  const result: number[] = [];

  let pcmValue = reader.read();

  while (pcmValue !== null) {
    // Do something with PCM values
    result.push(pcmValue);

    pcmValue = reader.read();
  }

  return result;
}
