import { getDb, getMetaValue, setMetaValue } from "../db";
import type { TutorProviderId, TutorProviderStatus, TutorRequest } from "../../shared/types";
import type { TutorProvider, TutorResult } from "./provider";
import { NoAIProvider } from "./noai";
import { ClaudeCodeProvider, CodexProvider } from "./cli";

const PROVIDERS: TutorProvider[] = [new ClaudeCodeProvider(), new CodexProvider(), new NoAIProvider()];
const DEFAULT_PROVIDER: TutorProviderId = "none";

export async function getTutorProviderStatuses(): Promise<TutorProviderStatus[]> {
  const out: TutorProviderStatus[] = [];
  for (const p of PROVIDERS) {
    try {
      const s = await p.checkAvailable();
      out.push({ id: p.id, label: p.label, available: s.available, detail: s.detail });
    } catch {
      out.push({ id: p.id, label: p.label, available: false, detail: "Check failed." });
    }
  }
  return out;
}

export function getSelectedProviderId(): TutorProviderId {
  const v = getMetaValue("tutor_provider");
  if (v === "claude-code" || v === "codex" || v === "none") return v;
  return DEFAULT_PROVIDER;
}

export function setSelectedProviderId(id: TutorProviderId): void {
  setMetaValue("tutor_provider", id);
}

function resolveProvider(id: TutorProviderId): TutorProvider {
  const found = PROVIDERS.find((p) => p.id === id);
  return found ?? PROVIDERS[PROVIDERS.length - 1];
}

/** Single constrained tutor call. Falls back to the built-in coach when the CLI is unavailable. */
export async function tutorChat(req: TutorRequest): Promise<TutorResult> {
  let selected = resolveProvider(getSelectedProviderId());
  let note = "";

  if (selected.id === "none") {
    // Auto-detect: users who finished onboarding before the AI-coach step
    // existed are stuck on "none" forever otherwise. If a CLI is present,
    // adopt it transparently and say so — the coach should just work.
    let detected: TutorProvider | null = null;
    for (const p of PROVIDERS) {
      if (p.id === "none") continue;
      const s = await p.checkAvailable().catch(() => ({ available: false, detail: "" }));
      if (s.available) { detected = p; break; }
    }
    if (!detected) return selected.chat(req);
    setSelectedProviderId(detected.id);
    selected = detected;
    note = `_(${detected.label} detected on this machine — using it as your coach from now on. Change anytime in Settings.)_\n\n`;
  } else {
    const status = await selected.checkAvailable().catch(() => ({ available: false, detail: "" }));
    if (!status.available) {
      const r = await new NoAIProvider().chat(req);
      return {
        reply: `_(${selected.label} unavailable — using the built-in offline coach. Check Settings for details.)_\n\n${r.reply}`,
        done: r.done,
      };
    }
  }

  const result = await selected.chat(req);
  if (selected.id !== "none" && result.done) {
    // CliTutorBase reports done=true only on spawn/CLI failure. Don't leave
    // the user with an error stub — serve real offline coaching instead.
    const r = await new NoAIProvider().chat(req);
    return {
      reply:
        `_(${selected.label} didn't return a response — here's the built-in coach instead. ` +
        `If this keeps happening, check that the CLI works in your terminal.)_\n\n${r.reply}`,
      done: false,
    };
  }
  return note ? { reply: note + result.reply, done: result.done } : result;
}

export function cancelTutor(): void {
  for (const p of PROVIDERS) p.cancel();
}

/** Log an AI session (provider + reference; transcript optional). No credentials stored. */
export function logAiSession(provider: string, kind: string, reference: string, transcript: unknown): void {
  getDb()
    .prepare(
      `INSERT INTO ai_sessions (id, device_id, provider, kind, reference, transcript, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      getMetaValue("device_id") ?? "unknown",
      provider,
      kind,
      reference,
      JSON.stringify(transcript ?? []),
      new Date().toISOString(),
    );
}
