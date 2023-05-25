import { create } from "zustand";

export const useImport = create<{
  crates: string[];
  selectedCrates: string[];
  setCrates: (crates: string[]) => void;
  setSelectedCrates: (crates: string[]) => void;
}>((set) => ({
  crates: [],
  selectedCrates: [],
  setCrates: (crates: string[]) => set({ crates }),
  setSelectedCrates: (crates: string[]) => set({ selectedCrates: crates }),
}));
