import fs from "fs/promises";
import { createFFmpeg } from "@ffmpeg/ffmpeg";

const ffmpegInstance = createFFmpeg();
let ffmpegLoadingPromise: Promise<void> | undefined = ffmpegInstance.load();

async function getFFmpeg() {
  if (ffmpegLoadingPromise) {
    await ffmpegLoadingPromise;
    ffmpegLoadingPromise = undefined;
  }

  return ffmpegInstance;
}

export async function generateWaveform(filePath: string) {
  const ffmpeg = await getFFmpeg();

  const virtualFilePath = "audio-file";
  const virtualWaveformFilePath = "waveform";

  // Load audio file
  const audioData = await fs.readFile(filePath);

  // Write audio file to ffmpeg in-memory file system
  ffmpeg.FS("writeFile", virtualFilePath, audioData);

  await ffmpeg.run(
    "-i",
    virtualFilePath,
    "-ac",
    "1",
    "-filter:a",
    "aresample=8000",
    "-map",
    "0:a",
    "-c:a",
    "pcm_s16le",
    "-f",
    "data",
    virtualWaveformFilePath
  );

  // After FFmpeg exits, use ffmpeg.FS() to read the data from the file system
  // and delete both the input and output files to free up memory
  const waveformData = ffmpeg.FS("readFile", virtualWaveformFilePath);
  ffmpeg.FS("unlink", virtualFilePath);
  ffmpeg.FS("unlink", virtualWaveformFilePath);

  return waveformData;
}

export async function getAudioFileDuration(filePath: string) {
  const ffmpeg = await getFFmpeg();

  const virtualFilePath = "audio-file";
  // const virtualAudioDataFilePath = "audio-metadata";

  // Load audio file
  const audioData = await fs.readFile(filePath);

  // Write audio file to ffmpeg in-memory file system
  ffmpeg.FS("writeFile", virtualFilePath, audioData);

  const out: string[] = [];

  ffmpeg.setLogger(({ message }) => {
    out.push(message);
  });

  await ffmpeg.run("-i", virtualFilePath, "-f", "null", "-");

  ffmpeg.setLogger(() => {});

  // After FFmpeg exits, use ffmpeg.FS() to read the data from the file system
  // and delete both the input and output files to free up memory
  ffmpeg.FS("unlink", virtualFilePath);

  const duration = out[out.length - 3].match(/time=(.+) bitrate/)?.[1];

  console.log("duration: ", duration);

  let durationInSeconds: number | undefined;

  if (duration) {
    const [hours, minutes, seconds] = duration.split(":");

    durationInSeconds =
      Number(hours) * 60 * 60 + Number(minutes) * 60 + Number(seconds);
  }

  console.log("duration in secs: ", durationInSeconds);

  return durationInSeconds;
}
