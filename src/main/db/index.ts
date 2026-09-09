import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { dbPath, dataDir } from "../paths";
import { MIGRATIONS, SCHEMA_VERSION } from "./migrations";

let db: Database.Database | null = null;

function getMeta(key: string): string | null {
  const row = db!.prepare("SELECT value FROM meta WHERE key = ?").get(key) as { value: string } | undefined;
  return row ? row.value : null;
}

function setMeta(key: string, value: string): void {
  db!.prepare("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
}

/** Open (or create) the database and run pending migrations. */
export function openDatabase(): Database.Database {
  if (db) return db;
  fs.mkdirSync(dataDir(), { recursive: true });
  db = new Database(dbPath());
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // meta must exist before we can read schema_version (chicken-and-egg)
  db.exec("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");

  const current = parseInt(getMeta("schema_version") ?? "0", 10);
  for (const m of MIGRATIONS) {
    if (m.version > current) {
      db.exec(m.sql);
      setMeta("schema_version", String(m.version));
      // eslint-disable-next-line no-console
      console.log(`[db] applied migration v${m.version}: ${m.description}`);
    }
  }

  if (!getMeta("device_id")) {
    setMeta("device_id", `dev-${randomUUID().slice(0, 8)}`);
  }

  const v = parseInt(getMeta("schema_version") ?? "0", 10);
  if (v !== SCHEMA_VERSION) {
    throw new Error(`Schema version mismatch: have ${v}, want ${SCHEMA_VERSION}`);
  }
  return db;
}

export function getDb(): Database.Database {
  if (!db) return openDatabase();
  return db;
}

export function getDeviceId(): string {
  getDb();
  return getMeta("device_id")!;
}

export function getMetaValue(key: string): string | null {
  getDb();
  return getMeta(key);
}

export function setMetaValue(key: string, value: string): void {
  getDb();
  setMeta(key, value);
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
