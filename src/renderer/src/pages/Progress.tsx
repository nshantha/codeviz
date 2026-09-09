import { useEffect, useState } from "react";
import { api, fmtMs, masteryColor } from "../api";
import type { ReportData, StudyPlan } from "../../../shared/types";

export default function Progress() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [openWeek, setOpenWeek] = useState<number | null>(null);

  useEffect(() => {
    api().generateReport().then(setReport).catch(() => {});
    api().getPlan().then(setPlan).catch(() => {});
  }, []);

  const exportMd = async () => {
    const file = await api().pickSaveFile(`algomentor-report-${new Date().toISOString().slice(0, 10)}.md`, [
      { name: "Markdown", extensions: ["md"] },
    ]);
    if (!file) return;
    await api().exportReportMarkdown(file);
    alert(`Report saved to ${file}`);
  };

  if (!report) return <p className="small">Loading…</p>;

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Progress</h1>
        <button className="btn ghost small" onClick={() => void exportMd()}>Export report (.md)</button>
      </div>
      <p className="sub">Generated {report.generatedAt.slice(0, 10)}</p>

      <div className="grid3" style={{ marginBottom: 18 }}>
        <div className="card stat"><div className="n">{report.totals.attempts}</div><div className="l">attempts</div></div>
        <div className="card stat"><div className="n">{Math.round(report.totals.solveRate * 100)}%</div><div className="l">solve rate</div></div>
        <div className="card stat"><div className="n">{fmtMs(report.totals.activeMinutes * 60000)}</div><div className="l">active practice</div></div>
        <div className="card stat"><div className="n">{report.totals.streakDays}d</div><div className="l">streak</div></div>
        <div className="card stat"><div className="n">{report.dueReviews}</div><div className="l">due reviews</div></div>
        <div className="card stat"><div className="n">{report.overdueReviews}</div><div className="l">overdue</div></div>
      </div>

      <h2>Pattern mastery</h2>
      <div className="card">
        {report.patternMastery.filter((p) => p.attempted > 0).map((p) => (
          <div key={p.pattern} style={{ marginBottom: 10 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
              <span><b>{p.pattern}</b> <span className="small">{p.solved}/{p.attempted} solved</span></span>
              <span className="small">{Math.round(p.mastery * 100)}%{p.medianActiveMs ? ` · median ${fmtMs(p.medianActiveMs)}` : ""}</span>
            </div>
            <div className="bar"><div style={{ width: `${Math.round(p.mastery * 100)}%`, background: masteryColor(p.mastery) }} /></div>
          </div>
        ))}
        {report.patternMastery.every((p) => p.attempted === 0) && <span className="small">No attempts yet.</span>}
      </div>

      <h2>Next 7 days</h2>
      <div className="card">
        {report.next7Days.map((n, i) => <div key={i} style={{ padding: "4px 0" }}>→ {n}</div>)}
      </div>

      <h2>Eight-week plan</h2>
      {plan?.weeks.map((w) => (
        <div className="card" key={w.week}>
          <div className="row" style={{ justifyContent: "space-between", cursor: "pointer" }} onClick={() => setOpenWeek(openWeek === w.week ? null : w.week)}>
            <h3 style={{ margin: 0 }}>Week {w.week}: {w.title}</h3>
            <span className="small">{w.questionIds.length} problems {openWeek === w.week ? "▾" : "▸"}</span>
          </div>
          <p className="small">{w.focus}</p>
          {openWeek === w.week && (
            <div className="small">Problems: {w.questionIds.join(", ")}</div>
          )}
        </div>
      ))}
    </div>
  );
}
