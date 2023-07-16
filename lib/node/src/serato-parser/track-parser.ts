import fs from "fs";
import assert from "assert";
import path from "path";
import musicMetadata from "music-metadata-browser";
import { BeatGrid, CuePoint, IMetadata, Track } from "@dj-migrator/common";
import * as ID3 from "./id3";
import * as VORBIS from "./vorbis";
import { parseSeratoMarkers2Tag } from "./parseSeratoMarkers2Tag";
import { parseSeratoBeatGridTag } from "./parseSeratoBeatGridTag";

export const SUPPORTED_FILE_TYPES = [".mp3", ".wav", ".flac"];

// ====================
// FUNCTIONS
// ====================

async function parseFlac(filePath: string) {
  // Verify that file is an MP3 or WAV
  const fileExtension = path.extname(filePath).toLowerCase();
  assert(fileExtension === ".flac", "Must be FLAC file");

  // Verify file exists
  const doesFileExist = fs.existsSync(filePath);
  assert(doesFileExist, "File does not exist");

  // Create read stream to parse song tags
  const readStream = fs.createReadStream(filePath);

  try {
    const fileStats = fs.statSync(filePath);

    // Parse song tags
    const tags = await musicMetadata.parseNodeStream(readStream);

    // Get track metadata for intermediary format
    const metadata: IMetadata = {
      title: tags.common?.title,
      artist: tags.common?.artist,
      album: tags.common?.album,
      genre: tags.common?.genre,
      bpm: tags.common?.bpm,
      key: tags.native.vorbis?.find((tag) => tag.id === "INITIALKEY")?.value,
      sampleRate: tags.format?.sampleRate,
      bitrate: 0,
      comment: tags.common?.comment,
      size: fileStats.size,
      duration: tags.format?.duration,
      location: path.resolve(filePath),
      fileExtension,
    };

    let cuePoints: CuePoint[] = [];
    let beatGrids: BeatGrid[] = [];

    const seratoTags = VORBIS.getSeratoTags(tags);

    if (seratoTags.SeratoMarkers2) {
      const decoded = VORBIS.decodeSeratoMarkers2Tag(seratoTags.SeratoMarkers2);
      cuePoints = parseSeratoMarkers2Tag(decoded);
    }

    if (seratoTags.SeratoBeatGrid) {
      const decoded = VORBIS.decodeSeratoBeatGridTag(seratoTags.SeratoBeatGrid);
      beatGrids = parseSeratoBeatGridTag(decoded);
    }

    // console.log(tags.common?.title, beatGrids);

    return new Track(metadata, cuePoints, beatGrids);
  } finally {
    // Destroy read stream if anything goes wrong
    readStream.destroy();
  }
}

async function parseMp3OrWav(filePath: string) {
  // Verify that the file is an MP3 or WAV
  const fileExtension = path.extname(filePath).toLowerCase();
  assert(
    [".mp3", ".wav"].includes(fileExtension),
    "Must be an MP3 or WAV file"
  );

  // Verify that the file exists
  const doesFileExist = fs.existsSync(filePath);
  assert(doesFileExist, "File does not exist");

  // Create read stream to parse song tags
  const readStream = fs.createReadStream(filePath);

  try {
    const fileStats = fs.statSync(filePath);

    // Parse song tags
    const tags = await musicMetadata.parseNodeStream(readStream);

    // Get track metadata for intermediary format
    const metadata: IMetadata = {
      title: tags.common?.title,
      artist: tags.common?.artist,
      album: tags.common?.album,
      genre: tags.common?.genre,
      bpm: tags.common?.bpm,
      key: tags.common?.key,
      sampleRate: tags.format?.sampleRate,
      bitrate: tags.format?.bitrate,
      comment: tags.common?.comment,
      size: fileStats.size,
      duration: tags.format?.duration,
      location: path.resolve(filePath),
      fileExtension,
    };

    let cuePoints: CuePoint[] = [];
    let beatGrids: BeatGrid[] = [];

    const seratoTags = ID3.getSeratoTags(tags);

    if (seratoTags.SeratoMarkers2) {
      const decoded = ID3.decodeSeratoMarkers2Tag(seratoTags.SeratoMarkers2);
      cuePoints = parseSeratoMarkers2Tag(decoded);
    }

    if (seratoTags.SeratoBeatGrid) {
      const decoded = ID3.decodeSeratoBeatGridTag(seratoTags.SeratoBeatGrid);
      beatGrids = parseSeratoBeatGridTag(decoded);
    }

    // console.log(tags.common?.title, beatGrids);

    return new Track(metadata, cuePoints, beatGrids);
  } finally {
    // Destroy read stream if anything goes wrong
    readStream.destroy();
  }
}

export async function parseTrack(filePath: string): Promise<Track> {
  const fileExtension = path.extname(filePath).toLowerCase();

  const absolutePath = path.resolve(filePath);

  const doesFileExist = fs.existsSync(absolutePath);
  const isSupportedFile = SUPPORTED_FILE_TYPES.includes(fileExtension);

  if (doesFileExist && isSupportedFile) {
    switch (fileExtension) {
      case ".flac":
        return await parseFlac(filePath);
      case ".mp3":
      case ".wav":
        return await parseMp3OrWav(filePath);
      default:
        break;
    }
  }

  throw "File is not supported or does not exist";
}

export function convertTracks(filePaths: string[]): Promise<Track[]> {
  const convertPromises = filePaths
    // Only supports mp3, wav and flac so far
    .filter((filePath) => {
      const isSupportedFile = SUPPORTED_FILE_TYPES.includes(
        path.extname(filePath).toLowerCase()
      );
      return isSupportedFile;
    })
    .map((filePath) => {
      return parseTrack(filePath);
    });

  // Wait for all tracks to resolve then build track map
  return Promise.all(convertPromises);
}
