import path from "path";

import { app, BrowserWindow, ipcMain, nativeTheme } from "electron";

import { colors } from "../common/colors";

import { initIpcHandlers } from "./ipc";
import { libraryStore } from "./stores/library-store";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createMainWindow = async () => {
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
  });

  return mainWindow;
};

const createImportWindow = async (mainWindow: BrowserWindow) => {
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
  nativeTheme.on("updated", () => {
    importWindow.setBackgroundColor(
      nativeTheme.shouldUseDarkColors
        ? darkThemeBackground
        : lightThemeBackground
    );
  });

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
  });

  return importWindow;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  initIpcHandlers();

  const mainWindow = await createMainWindow();

  // openImportWindow event handler
  ipcMain.on("OPEN_IMPORT_WINDOW", async () => {
    const importWindow = await createImportWindow(mainWindow);
  });
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
    createMainWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
