import { create } from "zustand";

export const useImport = create<{
  selectedPlaylists: string[];
  setSelectedPlaylists: (playlists: string[]) => void;
}>((set) => ({
  selectedPlaylists: [],
  setSelectedPlaylists: (playlists: string[]) =>
    set({ selectedPlaylists: playlists }),
}));
