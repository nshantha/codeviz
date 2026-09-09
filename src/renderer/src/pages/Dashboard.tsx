import { useEffect, useMemo, useState } from "react";
import { api, masteryColor } from "../api";
import type { GameState, NextUpItem, Profile } from "../../../shared/types";
import { COMPANY_LABELS, MASTERY_LABELS } from "../../../shared/types";
import { masteryBand } from "../band";
import "../game.css";

function heatColor(count: number): string {
  if (count <= 0) return "var(--bg3)";
  if (count === 1) return "rgba(61,214,140,0.25)";
  if (count <= 3) return "rgba(61,214,140,0.5)";
  if (count <= 5) return "rgba(61,214,140,0.75)";
  return "#3dd68c";
}

function mondayOf(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export default function Dashboard({ profile, go }: { profile: Profile; go: (page: string, arg?: unknown) => void }) {
  const [game, setGame] = useState<GameState | null>(null);
  const [nextUp, setNextUp] = useState<NextUpItem[]>([]);
  const [xpWidth, setXpWidth] = useState(0); // animate the XP bar on mount

  useEffect(() => {
    api().getGameState().then(setGame).catch(() => {});
    api().getNextUp(6).then(setNextUp).catch(() => {});
  }, []);

  useEffect(() => {
    if (!game) return;
    const pct = game.xpForNextLevel > 0 ? Math.min(1, game.xpIntoLevel / game.xpForNextLevel) : 0;
    const t = setTimeout(() => setXpWidth(pct * 100), 120);
    return () => clearTimeout(t);
  }, [game]);

  const miniHeat = useMemo(() => {
    if (!game) return null;
    const weeks: { date: string; count: number; future: boolean }[][] = [];
    const start = mondayOf(new Date());
    start.setDate(start.getDate() - 7 * 11); // last ~12 weeks
    const today = new Date();
    for (let w = 0; w < 12; w++) {
      const col: { date: string; count: number; future: boolean }[] = [];
      for (let r = 0; r < 7; r++) {
        const d = new Date(start);
        d.setDate(d.getDate() + w * 7 + r);
        const iso = d.toISOString().slice(0, 10);
        col.push({ date: iso, count: game.heatmap[iso] ?? 0, future: d > today });
      }
      weeks.push(col);
    }
    return weeks;
  }, [game]);

  // Weekly consistency ring geometry
  const R = 40;
  const CIRC = 2 * Math.PI * R;
  const weeklyFrac = game ? Math.min(1, game.weeklyActiveCount / 7) : 0;
  const goalAngle = -Math.PI / 2 + (5 / 7) * 2 * Math.PI; // 5-day goal marker
  const goalX1 = 48 + (R - 5) * Math.cos(goalAngle);
  const goalY1 = 48 + (R - 5) * Math.sin(goalAngle);
  const goalX2 = 48 + (R + 5) * Math.cos(goalAngle);
  const goalY2 = 48 + (R + 5) * Math.sin(goalAngle);

  const solveRate = game && game.totals.attempts > 0
    ? Math.round((game.totals.solved / game.totals.attempts) * 100)
    : 0;
  const goalHit = (game?.weeklyActiveCount ?? 0) >= 5;

  return (
    <div>
      <h1>What should I practice next?</h1>
      <p className="sub">
        Targeting {profile.targetCompanies.map((c) => COMPANY_LABELS[c]).join(", ")}
        {profile.interviewDate ? ` · interview ${profile.interviewDate}` : ""}
      </p>

      {/* ---------- Trainer header ---------- */}
      {game && (
        <div className="trainer-card">
          <div className="level-badge">
            <span className="lvl">LVL</span>
            <span className="num">{game.level}</span>
          </div>

          <div className="xp-block">
            <div className="xp-row">
              <span className="xp-title">Training progress</span>
              <span className="xp-nums">
                {game.xpIntoLevel.toLocaleString()} / {game.xpForNextLevel.toLocaleString()} XP · {game.xp.toLocaleString()} total
              </span>
            </div>
            <div className="xp-track">
              <div className="xp-fill" style={{ width: `${xpWidth}%` }} />
            </div>
            <div className="xp-hint small">Solve problems to earn XP and level up your trainer rank.</div>
          </div>

          <div className="consistency">
            <div className="ring-wrap">
              <svg width="96" height="96" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r={R} fill="none" stroke="var(--bg3)" strokeWidth="9" />
                <circle
                  cx="48" cy="48" r={R} fill="none"
                  stroke="var(--accent2)" strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={`${weeklyFrac * CIRC} ${CIRC}`}
                  transform="rotate(-90 48 48)"
                  style={{ transition: "stroke-dasharray 1.2s ease" }}
                />
                <line x1={goalX1} y1={goalY1} x2={goalX2} y2={goalY2} stroke="var(--warn)" strokeWidth="3" strokeLinecap="round" />
                <title>Weekly goal: 5 active days</title>
              </svg>
              <div className="ring-label">
                <span className="big">{game.weeklyActiveCount}</span>
                <span className="of">of 7 days</span>
              </div>
            </div>
            <div className="week-dots">
              {game.weeklyDays.map((d, i) => (
                <span key={d.date} className={`week-dot${d.active ? " on" : ""}`} title={`${d.date}: ${d.attempts} attempt${d.attempts === 1 ? "" : "s"}`} />
              ))}
            </div>
            <div className="goal-text">
              {goalHit
                ? <><strong>{Math.min(game.weeklyActiveCount, 5)}/5</strong> — weekly goal crushed</>
                : <><strong>{game.weeklyActiveCount}/5</strong> days this week</>}
            </div>
          </div>
        </div>
      )}

      {/* ---------- Mini heatmap strip ---------- */}
      {miniHeat && (
        <div className="card">
          <div className="section-head">
            <h3>Last 12 weeks</h3>
            <span className="small">attempts per day</span>
          </div>
          <div className="mini-heat">
            {miniHeat.flat().map((c) => (
              <span
                key={c.date}
                className="cell"
                title={`${c.date}: ${c.count} attempt${c.count === 1 ? "" : "s"}`}
                style={{ background: c.future ? "transparent" : heatColor(c.count) }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ---------- Stats row ---------- */}
      {game && (
        <div className="grid4" style={{ marginBottom: 4 }}>
          <div className="card stat"><div className="n">{game.totals.attempts}</div><div className="l">attempts</div></div>
          <div className="card stat"><div className="n">{solveRate}%</div><div className="l">solve rate</div></div>
          <div className="card stat"><div className="n">{game.totals.unaidedIds}</div><div className="l">unaided IDs</div></div>
          <div className="card stat"><div className="n">{game.totals.noHintSolves}</div><div className="l">no-hint solves</div></div>
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
        {!game?.rings.filter((p) => p.attempted > 0).length && <span className="small">Attempt problems to build mastery estimates.</span>}
        {game?.rings.filter((p) => p.attempted > 0).map((p) => (
          <div key={p.pattern} style={{ marginBottom: 10 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ cursor: "pointer" }} onClick={() => go("patterns", p.pattern)}>
                <b>{p.pattern}</b> <span className="small">· {MASTERY_LABELS[masteryBand(p.mastery, p.attempted)]} · {p.solved}/{p.attempted}</span>
              </span>
              <span className="small">{Math.round(p.mastery * 100)}%</span>
            </div>
            <div className="bar"><div style={{ width: `${Math.round(p.mastery * 100)}%`, background: masteryColor(p.mastery) }} /></div>
          </div>
        ))}
      </div>

      {game && (
        <p className="small" style={{ marginTop: 18 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); go("journey"); }} style={{ color: "var(--accent)" }}>
            View your journey map →
          </a>
        </p>
      )}
    </div>
  );
}
