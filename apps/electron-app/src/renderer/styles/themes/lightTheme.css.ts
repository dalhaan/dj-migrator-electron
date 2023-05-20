import { createTheme } from "@vanilla-extract/css";

import { vars } from "./themeContract.css";

export const lightTheme = createTheme(vars, {
  color: {
    background: "white",
    text: "black",
    titleBar: {
      background: "rgb(245,245,245)",
      backgroundUnfocused: "rgb(233,232,232)",
      text: "#555",
      textUnfocused: "grey",
      borderColor: "rgb(196,196,196)",
    },
  },
});
