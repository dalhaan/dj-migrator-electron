import path from "path";

import { BrowserWindow, nativeTheme } from "electron";

import { colors } from "../common/colors";

import { libraryStore } from "@/stores/library-store";

export const createExportWindow = async (mainWindow: BrowserWindow) => {
  const lightThemeBackground = "white";
  const darkThemeBackground = colors.almostBlack;

  // Create the import window
  const exportWindow = new BrowserWindow({
    parent: mainWindow,
    width: 660,
    height: 611,
    minWidth: 660,
    minHeight: 611,
    resizable: true,
    backgroundColor: nativeTheme.shouldUseDarkColors
      ? darkThemeBackground
      : lightThemeBackground,
    titleBarStyle: "hidden",
    trafficLightPosition: {
      x: 19,
      y: 18,
    },
    // transparent: true,
    // frame: false,
    // backgroundColor: "#00000000",
    // vibrancy: "under-window",
    // visualEffectState: "followWindow",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    show: false,
  });

  // Update window background colour on theme change.
  // Prevents seeing white background when resizing in dark mode.
  function updateTheme() {
    exportWindow.setBackgroundColor(
      nativeTheme.shouldUseDarkColors
        ? darkThemeBackground
        : lightThemeBackground
    );
  }

  nativeTheme.on("updated", updateTheme);

  // and load the import window
  if (EXPORT_WINDOW_VITE_DEV_SERVER_URL) {
    exportWindow.loadURL(
      EXPORT_WINDOW_VITE_DEV_SERVER_URL + "/export-window.html"
    );

    // Open the DevTools.
    // importWindow.webContents.openDevTools();
  } else {
    await exportWindow.loadFile(
      path.join(
        __dirname,
        `../renderer/${EXPORT_WINDOW_VITE_NAME}/import-window.html`
      )
    );
  }

  // Trick to prevent Electron from showing a blank screen at the start.
  exportWindow.on("ready-to-show", () => {
    exportWindow.show();
  });

  exportWindow.on("focus", () => {
    exportWindow.webContents.send("visibilityChange", "focus");
  });

  exportWindow.on("blur", () => {
    exportWindow.webContents.send("visibilityChange", "blur");
  });

  // Save reference to webContents to prevent it from being lost when it is destroyed
  const exportWindowWebContents = exportWindow.webContents;

  // Remove LibraryStore listener on close
  exportWindow.webContents.on("destroyed", () => {
    libraryStore.removeListener(exportWindowWebContents);
    nativeTheme.off("updated", updateTheme);
  });

  return exportWindow;
};
