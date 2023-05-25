import { style } from "@vanilla-extract/css";

// import { rem } from "../../../styles/style-utils";

// export const APP_MAX_WIDTH = rem(1500);
export const APP_PADDING = 80;

export const appContainer = style({
  width: "100%",
  height: "100%",

  display: "flex",
  flexDirection: "column",

  overflow: "auto",
});
