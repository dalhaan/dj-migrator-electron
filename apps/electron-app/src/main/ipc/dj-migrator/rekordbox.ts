import { Playlist, Tracks } from "@dj-migrator/common";
import { RekordboxParser } from "@dj-migrator/node";

import { Store } from "@/stores/createStore";

type RekordboxExportConfig = {
  saveCuesAsMemoryCues: boolean;
  saveCuesAsHotCues: boolean;
};

export function exportPlaylistsToRekordBoxXml(
  playlists: string[],
  outputPath: string,
  library: Store<{
    tracks: Tracks;
    playlists: Playlist[];
  }>,
  config: RekordboxExportConfig
) {
  // Get playlists from store
  const playlistsToConvert = library
    .getState()
    .playlists.filter((playlist) => playlists.includes(playlist.name));

  return RekordboxParser.convertToRekordbox({
    playlists: playlistsToConvert,
    tracks: library.getState().tracks,
    outputXMLPath: outputPath,
    saveCuesAsHotCues: config.saveCuesAsHotCues,
    saveCuesAsMemoryCues: config.saveCuesAsMemoryCues,
  });
}
