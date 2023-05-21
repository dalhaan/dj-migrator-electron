import { ILibraryData } from "@dj-migrator/common";
import { create } from "zustand";

export const useSerato = create<{
  library: ILibraryData | null;
  setLibrary: (library: ILibraryData) => void;
}>((set) => ({
  library: null,
  setLibrary: (library: ILibraryData) => set({ library }),
}));
