import { createTheme } from "@vanilla-extract/css";

import { colors } from "../colors.css";

import { vars } from "./themeContract.css";

export const darkTheme = createTheme(vars, {
  color: {
    text: colors.almostWhite,
    background: colors.almostBlack,
    titleBar: {
      background: "rgb(46,45,45)",
      backgroundUnfocused: "rgb(34,33,33)",
      text: "white",
      textUnfocused: "grey",
      borderColor: "black",
    },
  },
});
