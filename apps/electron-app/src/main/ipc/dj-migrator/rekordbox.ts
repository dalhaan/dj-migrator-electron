import { Tracks } from "@dj-migrator/common";
import { RekordboxParser } from "@dj-migrator/node";

import { libraryStore } from "@/stores/library-store";

type RekordboxExportConfig = {
  saveCuesAsMemoryCues: boolean;
  saveCuesAsHotCues: boolean;
};

export function exportPlaylistsToRekordBoxXml(
  playlists: string[],
  outputPath: string,
  config: RekordboxExportConfig
): Promise<void> {
  // Get playlists from store
  const playlistsToExport = libraryStore
    .getState()
    .playlists.filter((playlist) => playlists.includes(playlist.name));

  // Get tracks to add to ReckordBox collection
  const trackPathsToExport = new Set<string>();

  for (const playlist of playlistsToExport) {
    for (const playlistTrackPath of playlist.tracks) {
      trackPathsToExport.add(playlistTrackPath);
    }
  }

  const tracksToExport: Tracks = new Map();

  // Get subset of Tracks that are in the playlists
  for (const trackPath of trackPathsToExport) {
    const track = libraryStore.getState().tracks.get(trackPath);

    if (track) {
      tracksToExport.set(trackPath, track);
    }
  }

  return RekordboxParser.convertToRekordbox({
    playlists: playlistsToExport,
    tracks: tracksToExport,
    outputXMLPath: outputPath,
    saveCuesAsHotCues: config.saveCuesAsHotCues,
    saveCuesAsMemoryCues: config.saveCuesAsMemoryCues,
  });
}
