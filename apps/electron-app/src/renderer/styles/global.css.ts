import { globalStyle } from "@vanilla-extract/css";

globalStyle("html, body, #root", {
  height: "100%",
  overflow: "hidden",
});

globalStyle("body", {
  fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont",
  backgroundColor: "transparent",
});

globalStyle(
  "a, button, .rs-btn, .rs-table-cell-header .rs-table-cell-content, .rs-btn-close, .rs-picker-tag .rs-picker-toggle, .rs-toggle-presentation, .rs-toggle-presentation:after, .rs-nav-item",
  {
    cursor: "default",
    userSelect: "none",
  }
);
