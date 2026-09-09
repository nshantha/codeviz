import { useEffect, useState } from "react";
import { api, fmtMs, masteryColor } from "../api";
import type { NextUpItem, Profile, ReportData } from "../../../shared/types";
import { COMPANY_LABELS, MASTERY_LABELS } from "../../../shared/types";
import { masteryBand } from "../band";

export default function Dashboard({ profile, go }: { profile: Profile; go: (page: string, arg?: unknown) => void }) {
  const [nextUp, setNextUp] = useState<NextUpItem[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => {
    api().getNextUp(6).then(setNextUp).catch(() => {});
    api().generateReport().then(setReport).catch(() => {});
  }, []);

  return (
    <div>
      <h1>What should I practice next?</h1>
      <p className="sub">
        Targeting {profile.targetCompanies.map((c) => COMPANY_LABELS[c]).join(", ")}
        {profile.interviewDate ? ` · interview ${profile.interviewDate}` : ""}
      </p>

      {report && (
        <div className="grid3" style={{ marginBottom: 18 }}>
          <div className="card stat"><div className="n">{report.totals.attempts}</div><div className="l">attempts</div></div>
          <div className="card stat"><div className="n">{Math.round(report.totals.solveRate * 100)}%</div><div className="l">solve rate</div></div>
          <div className="card stat"><div className="n">{report.totals.streakDays}d</div><div className="l">streak</div></div>
        </div>
      )}

      <h2>Up next</h2>
      {nextUp.length === 0 && <div className="card"><span className="small">No recommendations yet — record your first attempt from Practice.</span></div>}
      {nextUp.map((n, i) => (
        <div className="qrow" key={i} onClick={() => n.questionId && go("practice", n.questionId)}>
          <span className={`badge ${n.kind === "review" ? "gaps" : n.kind === "new" ? "core" : ""}`}>{n.kind.replace("-", " ")}</span>
          <span className="title">{n.question ? `${n.question.title}` : n.pattern}</span>
          <span className="meta">{n.reason}</span>
        </div>
      ))}

      <h2>Pattern mastery</h2>
      <div className="card">
        {!report?.patternMastery.length && <span className="small">Attempt problems to build mastery estimates.</span>}
        {report?.patternMastery.filter((p) => p.attempted > 0).map((p) => (
          <div key={p.pattern} style={{ marginBottom: 10 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ cursor: "pointer" }} onClick={() => go("patterns", p.pattern)}>
                <b>{p.pattern}</b> <span className="small">· {MASTERY_LABELS[masteryBand(p.mastery, p.attempted)]} · {p.solved}/{p.attempted}</span>
              </span>
              <span className="small">{p.medianActiveMs ? `median ${fmtMs(p.medianActiveMs)}` : ""}</span>
            </div>
            <div className="bar"><div style={{ width: `${Math.round(p.mastery * 100)}%`, background: masteryColor(p.mastery) }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
