import { style } from "@vanilla-extract/css";

export const importScreen = style({
  height: "100%",

  display: "flex",
  flexDirection: "column",
  alignItems: "center",

  paddingLeft: 30,
  paddingRight: 30,
});

export const inner = style({
  width: "100%",
  height: "100%",
  maxWidth: 600,

  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "center",
});
