import { Playlist, Track } from "@dj-migrator/common";

import { Store } from "./createStore";

export const libraryStore = new Store<{
  tracks: Map<
    string,
    {
      key: number;
      absolutePath: string;
      track: Track;
    }
  >;
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
