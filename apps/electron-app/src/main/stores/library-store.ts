import { Playlist, Tracks } from "@dj-migrator/common";

import { Store, StoreOptions } from "./store";

import { LIBRARY_STORE_NAME } from "~/common/store-names";

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
        name: LIBRARY_STORE_NAME,
        ...options,
      }
    );
  }
}

export const libraryStore = new LibraryStore();
