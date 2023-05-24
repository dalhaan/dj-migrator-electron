import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import { parseAsPlaylist } from "./crate-parser";
import { parseTrack, SUPPORTED_FILE_TYPES } from "./track-parser";
import {
  Crate,
  InvalidSeratoDirError,
  IProgressCallback,
  Tracks,
} from "@dj-migrator/common";

export async function parseTracks(
  directory: string,
  tracks: string[],
  progressCallback: IProgressCallback = () => {}
): Promise<Tracks> {
  const trackMap: Tracks = new Map();

  for (const [index, track] of tracks.entries()) {
    // Only add track if it hasn't already been added
    if (trackMap.has(track)) continue;

    // Get absolute path as it seems Serato uses relative paths for crates on USBs
    const absolutePath = path.resolve(directory, track);

    // Track must exist and be an MP3 as those are the only files we can get cues from so far
    const fileExists = fs.existsSync(absolutePath);

    if (!fileExists) continue;

    const isSupportedFile = SUPPORTED_FILE_TYPES.includes(
      path.extname(absolutePath).toLowerCase()
    );

    if (!isSupportedFile) continue;

    // Add track to the track map
    const trackObject = await parseTrack(absolutePath);

    trackMap.set(track, {
      key: trackMap.size + 1,
      absolutePath, // TODO: Don't think we are using this field
      track: trackObject,
    });

    // Update progress callback
    progressCallback(
      (index + 1 / tracks.length) * 100,
      `Indexing track ${index + 1} of ${tracks.length})`
    );
  }

  return trackMap;
}

export async function findCrates(directory: string): Promise<Crate[]> {
  // Get crates from '_Serato_/Subcrates' dir
  const subcrateDir = path.resolve(directory, "_Serato_", "Subcrates");

  // Assert that the subcrate directory exists
  const isSeratoDirectory = fs.existsSync(subcrateDir);

  if (!isSeratoDirectory) {
    throw new InvalidSeratoDirError();
  }

  const files = await fsPromises.readdir(subcrateDir);

  // Filter out non-crate files
  const crateFilenames = files.filter((cratePath) => {
    const isCrateFile = path.extname(cratePath) === ".crate";
    return isCrateFile;
  });

  // Get proper path to crates
  const crateFilePaths = crateFilenames.map((cratePath) =>
    path.join(subcrateDir, cratePath)
  );

  // Get playlists to convert
  const crates = crateFilePaths.map((filePath) => {
    const playlist = parseAsPlaylist(filePath);

    return {
      name: playlist.name,
      filePath,
      tracks: playlist.tracks,
    };
  });

  return crates;
}
