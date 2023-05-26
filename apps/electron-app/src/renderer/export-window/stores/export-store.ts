import { create } from "zustand";

export const useExport = create<{
  selectedPlaylists: string[];
  saveFilePath: string | null;
  setSelectedPlaylists: (playlists: string[]) => void;
  setSaveFilePath: (filePath: string | null) => void;
}>((set) => ({
  selectedPlaylists: [],
  saveFilePath: null,
  setSelectedPlaylists: (playlists: string[]) =>
    set({ selectedPlaylists: playlists }),
  setSaveFilePath: (filePath: string | null) => set({ saveFilePath: filePath }),
}));
