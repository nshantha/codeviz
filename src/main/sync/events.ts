import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getDb, getDeviceId, getMetaValue } from "../db";

export interface SyncEvent {
  event_id: string;
  device_id: string;
  ts: string;
  entity: "attempt" | "design_session" | "story" | "tombstone";
  action: "upsert" | "delete";
  payload: Record<string, unknown>;
}

export function getSyncFolder(): string | null {
  return getMetaValue("sync_folder");
}

export function setSyncFolder(folder: string | null): void {
  if (folder) {
    fs.mkdirSync(folder, { recursive: true });
    fs.mkdirSync(path.join(folder, "devices"), { recursive: true });
    const manifestPath = path.join(folder, "manifest.json");
    if (!fs.existsSync(manifestPath)) {
      fs.writeFileSync(
        manifestPath,
        JSON.stringify({ format: "algomentor-sync", version: 1, createdAt: new Date().toISOString() }, null, 1),
      );
    }
    getDb().prepare("INSERT INTO meta (key, value) VALUES ('sync_folder', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(folder);
  } else {
    getDb().prepare("DELETE FROM meta WHERE key = 'sync_folder'").run();
  }
}

function deviceLogPath(folder: string, deviceId: string): string {
  return path.join(folder, "devices", `${deviceId}.jsonl`);
}

/**
 * Append one event to this device's sync log. No-op when sync isn't
 * configured — the SQLite row remains the source of truth either way.
 */
export function appendEvent(entity: SyncEvent["entity"], action: SyncEvent["action"], payload: Record<string, unknown>): void {
  const folder = getSyncFolder();
  if (!folder) return;
  const event: SyncEvent = {
    event_id: (payload.id as string) ?? randomUUID(),
    device_id: getDeviceId(),
    ts: new Date().toISOString(),
    entity,
    action,
    payload,
  };
  fs.appendFileSync(deviceLogPath(folder, event.device_id), JSON.stringify(event) + "\n", "utf8");
  getDb().prepare("INSERT INTO meta (key, value) VALUES ('last_log_write', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(event.ts);
}

export function readAllEvents(folder: string): SyncEvent[] {
  const dir = path.join(folder, "devices");
  if (!fs.existsSync(dir)) return [];
  const events: SyncEvent[] = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".jsonl")) continue;
    for (const line of fs.readFileSync(path.join(dir, f), "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        events.push(JSON.parse(line) as SyncEvent);
      } catch {
        // skip corrupt lines — never fail a merge on one bad line
      }
    }
  }
  return events.sort((a, b) => (a.ts < b.ts ? -1 : 1));
}

export function deviceLogPathFor(folder: string, deviceId: string): string {
  return deviceLogPath(folder, deviceId);
}
