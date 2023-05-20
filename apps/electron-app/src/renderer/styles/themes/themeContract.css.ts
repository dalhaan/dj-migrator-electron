import { createThemeContract } from "@vanilla-extract/css";

export const vars = createThemeContract({
  color: {
    text: null,
    background: null,
    titleBar: {
      background: null,
      backgroundUnfocused: null,
      text: null,
      textUnfocused: null,
      borderColor: null,
    },
  },
});
