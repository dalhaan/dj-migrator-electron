import { Playlist, Track, Tracks } from "@dj-migrator/common";
import { create } from "zustand";

import { LIBRARY_STORE_NAME } from "~/common/store-names";

export const useLibrary = create<{
  tracks: Tracks;
  playlists: Playlist[];
}>((set) => {
  window.electronAPI.onStoreChange(LIBRARY_STORE_NAME, set);
  window.electronAPI.getStore(LIBRARY_STORE_NAME);

  return {
    tracks: new Map(),
    playlists: [],
    selectedTrack: null,
    selectedPlaylist: null,
    setTracks: (tracks: Tracks) => {
      window.electronAPI.updateStore(LIBRARY_STORE_NAME, { tracks });
    },
    setPlaylists: (playlists: Playlist[]) => {
      window.electronAPI.updateStore(LIBRARY_STORE_NAME, { playlists });
    },
  };
});

export const useMainStore = create<{
  selectedTrack: Track | null;
  selectedPlaylist: Playlist | null;
  setSelectedTrack: (track: Track | null) => void;
  setSelectedPlaylist: (playlist: Playlist | null) => void;
}>((set) => {
  return {
    selectedTrack: null,
    selectedPlaylist: null,
    setSelectedTrack: (track: Track | null) => {
      set({ selectedTrack: track });
    },
    setSelectedPlaylist: (playlist: Playlist | null) =>
      set({ selectedPlaylist: playlist }),
  };
});
