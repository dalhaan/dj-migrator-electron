import { style } from "@vanilla-extract/css";

import { vars } from "./themes/themeContract.css";

export const app = style({
  height: "100%",

  display: "flex",
  flexDirection: "column",

  color: vars.color.text,
  backgroundColor: vars.color.background,
});

export const windowBlur = style({});
