import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

// import "@/styles/reset.css";
import "rsuite/dist/rsuite.min.css";
import "@/styles/global.css";
import "@/styles/colors.css";

import { router } from "@/export-window/router/router";
import { useWindow } from "@/stores/windowStore";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

window.electronAPI.onWindowVisiblityChange((value) => {
  useWindow.setState({ isWindowFocused: value === "focus" });
});
