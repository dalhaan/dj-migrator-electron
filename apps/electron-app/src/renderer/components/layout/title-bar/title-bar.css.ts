import { style, ComplexStyleRule } from "@vanilla-extract/css";

import { windowBlur } from "../../../styles/app.css";
import { vars } from "../../../styles/themes/themeContract.css";

export const titleBar = style({
  "-webkit-app-region": "drag",
  height: 52,

  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  paddingLeft: 80,
  paddingRight: 80,

  color: vars.color.titleBar.text,
  background: vars.color.titleBar.background,
  borderBottomWidth: 1,
  borderBottomStyle: "solid",
  borderBottomColor: vars.color.titleBar.borderColor,

  selectors: {
    [`${windowBlur} &`]: {
      color: vars.color.titleBar.textUnfocused,
      background: vars.color.titleBar.backgroundUnfocused,
    },
  },
} as ComplexStyleRule);

export const title = style({
  fontSize: `${15 / 16}rem`,
  fontWeight: "700",
  textAlign: "center",
  whiteSpace: "nowrap",

  overflow: "hidden",
  textOverflow: "ellipsis",
});
