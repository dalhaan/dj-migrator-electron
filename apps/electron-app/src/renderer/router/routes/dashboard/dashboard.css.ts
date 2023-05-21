import { style } from "@vanilla-extract/css";

export const dashboard = style({
  height: "100%",

  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
});

export const display = style({
  display: "grid",
  gridTemplateColumns: "300px 1fr",
});
