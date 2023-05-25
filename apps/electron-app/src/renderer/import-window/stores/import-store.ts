import { create } from "zustand";

export const useImport = create<{
  crates: string[];
  selectedCrates: string[];
  setSelectedCrates: (crates: string[]) => void;
}>((set) => ({
  crates: [],
  selectedCrates: [],
  setSelectedCrates: (crates: string[]) => set({ selectedCrates: crates }),
}));
