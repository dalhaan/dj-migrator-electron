import path from "path";

import { app, BrowserWindow, nativeTheme } from "electron";

import { colors } from "../common/colors";

import { initIpcHandlers } from "./ipc";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  const lightThemeBackground = "white";
  const darkThemeBackground = colors.almostBlack;

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 888,
    resizable: false,
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
  nativeTheme.on("updated", () => {
    mainWindow.setBackgroundColor(
      nativeTheme.shouldUseDarkColors
        ? darkThemeBackground
        : lightThemeBackground
    );
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
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
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  initIpcHandlers();

  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
