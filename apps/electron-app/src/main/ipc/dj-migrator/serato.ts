import {
  Crate,
  InvalidSeratoDirError,
  IpcResponse,
  Playlist,
  ipcResponse,
} from "@dj-migrator/common";
import { SeratoParser } from "@dj-migrator/node";

import { libraryStore } from "@/stores/library-store";

export async function findCrates(
  directory: string
): Promise<IpcResponse<Crate[]>> {
  if (!directory) {
    return ipcResponse("DirectoryNotFound");
  }

  try {
    const crates = await SeratoParser.findCrates(directory);

    return ipcResponse("success", crates);
  } catch (error) {
    if (error instanceof InvalidSeratoDirError) {
      return ipcResponse("InvalidSeratoDirError", error.message);
    }

    throw error;
  }
}

export async function parseCrates(directory: string, crates: Crate[]) {
  const trackPaths = new Set<string>();

  for (const crate of crates) {
    for (const track of crate.tracks) {
      trackPaths.add(track);
    }
  }

  const tracks = await SeratoParser.parseTracks(
    directory,
    Array.from(trackPaths)
  );

  const playlists: Playlist[] = [];

  for (const crate of crates) {
    const playlist: Playlist = {
      name: crate.name,
      tracks: [],
    };

    for (const track of crate.tracks) {
      playlist.tracks.push(track);
    }

    playlists.push(playlist);
  }

  libraryStore.setState({
    tracks,
    playlists,
  });
}
