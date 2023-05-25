import { Crate } from "@dj-migrator/common";
import { create } from "zustand";

export const useImport = create<{
  directory: string | null;
  crates: Crate[];
  selectedCrates: string[];
  setDirectory: (directory: string | null) => void;
  setCrates: (crates: Crate[]) => void;
  setSelectedCrates: (crates: string[]) => void;
  reset: () => void;
}>((set) => ({
  directory: null,
  crates: [],
  selectedCrates: [],
  setDirectory: (directory: string | null) => set({ directory }),
  setCrates: (crates: Crate[]) => set({ crates }),
  setSelectedCrates: (crates: string[]) => set({ selectedCrates: crates }),
  reset: () => {
    set({
      directory: null,
      crates: [],
      selectedCrates: [],
    });
  },
}));
