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
  selectedTrackId: string | null;
  selectedPlaylist: Playlist | null;
  setSelectedTrackId: (trackId: string | null) => void;
  setSelectedPlaylist: (playlist: Playlist | null) => void;
}>((set) => {
  return {
    selectedTrackId: null,
    selectedPlaylist: null,
    setSelectedTrackId: (trackId: string | null) => {
      set({ selectedTrackId: trackId });
    },
    setSelectedPlaylist: (playlist: Playlist | null) =>
      set({ selectedPlaylist: playlist }),
  };
});
