import { Playlist, Tracks } from "@dj-migrator/common";

import { Store, StoreOptions } from "./store";

class LibraryStore extends Store<{
  tracks: Tracks;
  playlists: Playlist[];
}> {
  constructor(options?: Pick<StoreOptions, "listeners">) {
    super(
      {
        tracks: new Map(),
        playlists: [],
      },
      {
        name: "library",
        ...options,
      }
    );
  }
}

export const libraryStore = new LibraryStore();
