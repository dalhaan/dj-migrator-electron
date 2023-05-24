import { Playlist, Tracks } from "@dj-migrator/common";

import { Store } from "./createStore";

export const libraryStore = new Store<{
  tracks: Tracks;
  playlists: Playlist[];
}>(
  {
    tracks: new Map(),
    playlists: [],
  },
  {
    name: "library",
  }
);
