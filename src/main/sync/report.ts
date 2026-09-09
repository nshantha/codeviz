import fs from "node:fs";
import { getDb } from "../db";
import type { ReportData } from "../../shared/types";
import { getProfileInternal } from "../profile";
import { listAttemptsInternal } from "../learning/engine";
import { getPatternStatesInternal, getReviewQueueInternal } from "../learning/scheduler";
import { COMPANY_LABELS } from "../../shared/types";

/** Human-readable progress report (Markdown). For reading/sharing — not importable. */
export function generateReportInternal(): ReportData {
  const profile = getProfileInternal();
  const attempts = listAttemptsInternal();
  const states = getPatternStatesInternal();
  const queue = getReviewQueueInternal();
  const now = new Date();

  const solved = attempts.filter((a) => a.outcome === "solved").length;
  const activeMinutes = Math.round(attempts.reduce((n, a) => n + a.activeMs, 0) / 60000);

  // streak: consecutive days with >=1 attempt, ending today/yesterday
  const days = new Set(attempts.map((a) => a.createdAt.slice(0, 10)));
  let streak = 0;
  const cursor = new Date(now);
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const byPattern = new Map<string, { attempted: number; solved: number; times: number[] }>();
  for (const a of attempts) {
    const q = (getDb().prepare("SELECT pattern FROM questions WHERE leetcode_id = ?").get(a.questionId) as { pattern: string } | undefined)?.pattern ?? "Unknown";
    if (!byPattern.has(q)) byPattern.set(q, { attempted: 0, solved: 0, times: [] });
    const e = byPattern.get(q)!;
    e.attempted++;
    if (a.outcome === "solved") {
      e.solved++;
      e.times.push(a.activeMs);
    }
  }
  const patternMastery = states.map((s) => {
    const e = byPattern.get(s.pattern);
    const times = (e?.times ?? []).sort((a, b) => a - b);
    return {
      pattern: s.pattern,
      mastery: Math.round(s.mastery * 100) / 100,
      attempted: e?.attempted ?? 0,
      solved: e?.solved ?? 0,
      medianActiveMs: times.length ? times[Math.floor(times.length / 2)] : null,
    };
  });

  const due = queue.filter((r) => new Date(r.nextReview) <= now).length;
  const overdue = queue.filter((r) => (r.overdueDays ?? 0) > 0).length;
  const designCount = (getDb().prepare("SELECT COUNT(*) AS c FROM design_sessions WHERE deleted = 0").get() as { c: number }).c;
  const storyCount = (getDb().prepare("SELECT COUNT(*) AS c FROM stories WHERE deleted = 0").get() as { c: number }).c;

  const weak = [...states].filter((s) => s.problemsAttempted > 0).sort((a, b) => a.mastery - b.mastery).slice(0, 3);
  const next7Days = [
    ...weak.map((s) => `Strengthen ${s.pattern} (mastery ${Math.round(s.mastery * 100)}%) with 2-3 fresh problems`),
    ...(overdue > 0 ? [`Clear ${overdue} overdue review${overdue === 1 ? "" : "s"} before new material`] : []),
    ...(due > 0 ? [`Work through ${due} due review${due === 1 ? "" : "s"} with labels hidden`] : []),
    ...(designCount === 0 ? ["Do one system design session — it's the senior-level differentiator"] : []),
    ...(storyCount < 3 ? ["Bank at least 3 behavioral stories in STAR form"] : []),
  ].slice(0, 5);

  const companyNames: string[] = (profile?.targetCompanies ?? []).map((c) => COMPANY_LABELS[c]);
  const companies = companyNames.join(", ") || "—";
  const lines = [
    `# AlgoMentor Progress Report`,
    ``,
    `Generated ${now.toISOString().slice(0, 10)} · Target: ${companies}`,
    ``,
    `## Consistency`,
    ``,
    `- Attempts: ${attempts.length} (${solved} solved, ${attempts.length ? Math.round((solved / attempts.length) * 100) : 0}% solve rate)`,
    `- Active practice time: ${activeMinutes} min`,
    `- Current streak: ${streak} day${streak === 1 ? "" : "s"}`,
    ``,
    `## Pattern mastery`,
    ``,
    ...patternMastery.map(
      (p) => `- ${p.pattern}: ${Math.round(p.mastery * 100)}% — ${p.solved}/${p.attempted} solved${p.medianActiveMs !== null ? `, median ${Math.round(p.medianActiveMs / 60000)} min` : ""}`,
    ),
    ``,
    `## Reviews`,
    ``,
    `- Due: ${due} · Overdue: ${overdue}`,
    ``,
    `## Design & behavioral`,
    ``,
    `- System design sessions: ${designCount}`,
    `- Behavioral stories banked: ${storyCount}`,
    ``,
    `## Next 7 days`,
    ``,
    ...next7Days.map((n) => `- ${n}`),
    ``,
  ];

  return {
    generatedAt: now.toISOString(),
    profile,
    totals: {
      attempts: attempts.length,
      solved,
      solveRate: attempts.length ? solved / attempts.length : 0,
      activeMinutes,
      streakDays: streak,
    },
    patternMastery,
    dueReviews: due,
    overdueReviews: overdue,
    designSessions: designCount,
    stories: storyCount,
    next7Days,
    markdown: lines.join("\n"),
  };
}

export function exportReportMarkdown(filePath: string): { path: string } {
  const report = generateReportInternal();
  fs.writeFileSync(filePath, report.markdown, "utf8");
  return { path: filePath };
}
