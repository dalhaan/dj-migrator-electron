import { create } from "zustand";

export const useWindow = create(() => ({
  isWindowFocused: true,
}));
