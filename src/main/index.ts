import { app, BrowserWindow } from "electron";
import path from "node:path";
import { openDatabase, closeDatabase } from "./db";
import { seedCatalog } from "./data/seed";
import { registerIpc } from "./ipc";

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: "AlgoMentor",
    icon: path.join(__dirname, "..", "..", "assets", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (process.env.ALGOMENTOR_DEV === "1" && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  }

  mainWindow.webContents.on("did-fail-load", (_e, code, desc) => {
    console.error("[main] renderer failed to load:", code, desc);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function init(): Promise<void> {
  openDatabase();
  try {
    const seed = seedCatalog();
    // eslint-disable-next-line no-console
    console.log(`[main] catalog: ${seed.seeded ? "seeded" : "already present"} (${seed.count} questions)`);
  } catch (err) {
    // A missing catalog must never prevent the app from opening or produce
    // an unhandled rejection. The practice views will show an empty bank.
    // eslint-disable-next-line no-console
    console.error("[main] catalog seed failed:", (err as Error).message);
  }
  registerIpc();
}

void app.whenReady().then(async () => {
  await init();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  closeDatabase();
});
