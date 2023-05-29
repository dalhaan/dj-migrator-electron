import {
  parseWaveformData,
  generateWaveform,
  getAudioFileDuration,
  transformWaveformDataForWebGL,
} from "@dj-migrator/node";

// import { getFilePathDialog } from "./file-system";

export async function getWaveformData(filePath: string): Promise<
  | {
      waveformData: number[];
      duration: number | undefined;
    }
  | undefined
> {
  // const filePath = await getFilePathDialog();

  // if (!filePath) return;

  console.log(filePath);

  const duration = await getAudioFileDuration(filePath);
  const waveformDataBuffer = Buffer.from(await generateWaveform(filePath));
  const waveformData = await parseWaveformData(waveformDataBuffer);
  const waveformDataTransformed = transformWaveformDataForWebGL(waveformData);

  return {
    waveformData: waveformDataTransformed,
    duration,
  };
}
