import { style } from "@vanilla-extract/css";

export const controlToolbar = style({
  minHeight: 53,
});

export const cuepointToolbar = style({
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  columnGap: 10,
  rowGap: 5,
});
