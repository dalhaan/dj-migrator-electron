import { Track } from "@dj-migrator/common";
import { create } from "zustand";

export const useLibrary = create<{
  tracks: Track[];
  setTracks: (tracks: Track[]) => void;
}>((set) => ({
  tracks: [],
  setTracks: (tracks: Track[]) => set({ tracks }),
}));
