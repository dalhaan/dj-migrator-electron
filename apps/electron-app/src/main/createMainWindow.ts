import path from "path";

import { BrowserWindow, nativeTheme } from "electron";

import { libraryStore } from "@/stores/library-store";
import { colors } from "~/common/colors";

export const createMainWindow = async () => {
  const lightThemeBackground = "white";
  const darkThemeBackground = colors.almostBlack;

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 888,
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
      nodeIntegrationInWorker: true,
    },
    show: false,
  });

  // Update window background colour on theme change.
  // Prevents seeing white background when resizing in dark mode.
  function updateTheme() {
    mainWindow.setBackgroundColor(
      nativeTheme.shouldUseDarkColors
        ? darkThemeBackground
        : lightThemeBackground
    );
  }

  nativeTheme.on("updated", updateTheme);

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL + "/main-window.html");

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(
      path.join(
        __dirname,
        `../renderer/${MAIN_WINDOW_VITE_NAME}/main-window.html`
      )
    );
  }

  // Trick to prevent Electron from showing a blank screen at the start.
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("focus", () => {
    mainWindow.webContents.send("visibilityChange", "focus");
  });

  mainWindow.on("blur", () => {
    mainWindow.webContents.send("visibilityChange", "blur");
  });

  // Save reference to webContents to prevent it from being lost when it is destroyed
  const mainWindowWebContents = mainWindow.webContents;

  // Remove LibraryStore listener on close
  mainWindow.webContents.on("destroyed", () => {
    libraryStore.removeListener(mainWindowWebContents);
    nativeTheme.off("updated", updateTheme);
  });

  return mainWindow;
};
