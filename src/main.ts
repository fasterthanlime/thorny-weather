
import {enableLiveReload} from "electron-compile";
import {app, BrowserWindow} from "electron";
import {join, resolve} from "path";
import constants from "./constants";

if (process.env.CAPSULE_LIBRARY_PATH) {
  // chromium doesn't play along with DC capture
  // so we just disable acceleration when captured!
  app.disableHardwareAcceleration();
}

app.on("ready", () => {
  enableLiveReload();

  const win = new BrowserWindow();
  win.setTitle("Thorny Weather");
  const iconPath = resolve(__dirname, "..", "images", "ld.png");
  if (app.dock) {
    app.dock.setIcon(iconPath as any as Electron.NativeImage);
  }
  if (process.platform === "win32" || process.platform === "linux") {
    win.setIcon(iconPath as any as Electron.NativeImage);
  }
  win.setSize(constants.windowWidth, constants.windowHeight);
  if (process.env.DEVTOOLS === "1") {
    win.setPosition(0, 0);
  } else {
    win.center();
  }
  win.setResizable(false);
  const url = `file://${join(__dirname, "index.html")}`;
  win.setMenuBarVisibility(false);
  win.loadURL(url);
  win.show();
  if (process.env.DEVTOOLS === "1") {
    win.webContents.openDevTools({mode: "detach"});
  }
});

app.on("window-all-closed", () => {
  app.quit();
});
