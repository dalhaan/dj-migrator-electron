import { style } from "@vanilla-extract/css";

import { colors } from "../../../styles/colors.css";

export const trackDisplay = style({
  height: "100%",
});

export const selectedTrack = style({
  backgroundColor: colors.selected,
});
