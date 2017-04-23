
import {enableLiveReload} from "electron-compile";
import {app, BrowserWindow} from "electron";
import {join, resolve} from "path";
import constants from "./constants";

app.on("ready", () => {
  enableLiveReload();

  const win = new BrowserWindow();
  win.setTitle("A Sm*ll W***d");
  const iconPath = resolve(__dirname, "..", "images", "ld.png");
  if (app.dock) {
    app.dock.setIcon(iconPath as any as Electron.NativeImage);
  }
  win.setIcon(iconPath as any as Electron.NativeImage);
  win.setPosition(20, 20);
  win.setSize(constants.windowWidth, constants.windowHeight);
  win.setResizable(false);
  const url = `file://${join(__dirname, "index.html")}`;
  win.setMenuBarVisibility(false);
  win.loadURL(url);
  win.show();
  win.webContents.openDevTools({mode: "detach"});
});

app.on("window-all-closed", () => {
  app.quit();
});
