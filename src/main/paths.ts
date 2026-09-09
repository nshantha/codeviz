import { app } from "electron";
import path from "node:path";
import fs from "node:fs";

/** App-owned directories. Everything user data lives under userData. */
export function dataDir(): string {
  if (process.env.ALGOMENTOR_DEV === "1") {
    const d = path.join(process.cwd(), ".algomentor-dev");
    fs.mkdirSync(d, { recursive: true });
    return d;
  }
  return app.getPath("userData");
}

export function dbPath(): string {
  return path.join(dataDir(), "algomentor.db");
}

/** App-owned empty working directory for CLI tutor subprocesses. */
export function tutorWorkDir(): string {
  const d = path.join(dataDir(), "tutor-workdir");
  fs.mkdirSync(d, { recursive: true });
  return d;
}

/** Per-device sync log directory (Milestone 3). */
export function localSyncLogDir(): string {
  const d = path.join(dataDir(), "sync-log");
  fs.mkdirSync(d, { recursive: true });
  return d;
}

export function appVersion(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("../../package.json").version as string;
  } catch {
    return "0.1.0";
  }
}
