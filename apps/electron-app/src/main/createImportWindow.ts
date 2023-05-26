import path from "path";

import { BrowserWindow, nativeTheme } from "electron";

import { libraryStore } from "@/stores/library-store";
import { colors } from "~/common/colors";

export const createImportWindow = async (mainWindow: BrowserWindow) => {
  const lightThemeBackground = "white";
  const darkThemeBackground = colors.almostBlack;

  // Create the import window
  const importWindow = new BrowserWindow({
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
    importWindow.setBackgroundColor(
      nativeTheme.shouldUseDarkColors
        ? darkThemeBackground
        : lightThemeBackground
    );
  }

  nativeTheme.on("updated", updateTheme);

  // and load the import window
  if (IMPORT_WINDOW_VITE_DEV_SERVER_URL) {
    importWindow.loadURL(
      IMPORT_WINDOW_VITE_DEV_SERVER_URL + "/import-window.html"
    );

    // Open the DevTools.
    // importWindow.webContents.openDevTools();
  } else {
    await importWindow.loadFile(
      path.join(
        __dirname,
        `../renderer/${IMPORT_WINDOW_VITE_NAME}/import-window.html`
      )
    );
  }

  // Trick to prevent Electron from showing a blank screen at the start.
  importWindow.on("ready-to-show", () => {
    importWindow.show();
  });

  importWindow.on("focus", () => {
    importWindow.webContents.send("visibilityChange", "focus");
  });

  importWindow.on("blur", () => {
    importWindow.webContents.send("visibilityChange", "blur");
  });

  // Save reference to webContents to prevent it from being lost when it is destroyed
  const importWindowWebContents = importWindow.webContents;

  // Remove LibraryStore listener on close
  importWindow.webContents.on("destroyed", () => {
    libraryStore.removeListener(importWindowWebContents);
    nativeTheme.off("updated", updateTheme);
  });

  return importWindow;
};
