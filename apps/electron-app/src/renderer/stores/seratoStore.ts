import { create } from "zustand";

export const useSerato = create<{
  crates: string[];
  setCrates: (crates: string[]) => void;
}>((set) => ({
  crates: [] as string[],
  setCrates: (crates: string[]) => set({ crates }),
}));
