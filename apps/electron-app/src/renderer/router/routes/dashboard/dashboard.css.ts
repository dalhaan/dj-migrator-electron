import { style } from "@vanilla-extract/css";

export const dashboard = style({
  height: "100%",

  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
});

export const displayContainer = style({
  position: "relative",
  width: "100%",
  height: "100%",
});

export const display = style({
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,

  display: "grid",
  gridTemplateColumns: "300px 1fr",
});
