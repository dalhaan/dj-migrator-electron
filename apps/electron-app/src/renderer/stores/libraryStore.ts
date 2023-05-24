import { Playlist, Track, Tracks } from "@dj-migrator/common";
import { create } from "zustand";

export const useLibrary = create<{
  tracks: Tracks;
  playlists: Playlist[];
  selectedTrack: Track | null;
  selectedPlaylist: Playlist | null;
  setTracks: (tracks: Tracks) => void;
  setPlaylists: (playlists: Playlist[]) => void;
  setSelectedTrack: (track: Track | null) => void;
  setSelectedPlaylist: (playlist: Playlist | null) => void;
}>((set) => {
  window.electronAPI.onStoreChange("library", set);
  window.electronAPI.getStore("library");

  return {
    tracks: new Map(),
    playlists: [],
    selectedTrack: null,
    selectedPlaylist: null,
    setTracks: (tracks: Tracks) => {
      window.electronAPI.updateStore("library", { tracks });
      set({ tracks });
    },
    setPlaylists: (playlists: Playlist[]) => {
      window.electronAPI.updateStore("library", { playlists });
      set({ playlists });
    },
    setSelectedTrack: (track: Track | null) => {
      set({ selectedTrack: track });
    },
    setSelectedPlaylist: (playlist: Playlist | null) =>
      set({ selectedPlaylist: playlist }),
  };
});
