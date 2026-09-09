import type { AlgoMentorAPI } from "../../shared/types";

/** Typed access to the preload bridge. In dev-without-electron, this throws. */
export function api(): AlgoMentorAPI {
  const a = (window as unknown as { algomentor?: AlgoMentorAPI }).algomentor;
  if (!a) throw new Error("AlgoMentor bridge not available (are you running inside Electron?)");
  return a;
}

export function fmtMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

export function masteryColor(m: number): string {
  if (m < 0.3) return "#e5484d";
  if (m < 0.55) return "#f5a524";
  if (m < 0.8) return "#46a758";
  return "#3dd68c";
}
