import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { Achievement, GameState, JourneyDay, PatternRing } from "../../../shared/types";
import "../game.css";

function heatColor(count: number): string {
  if (count <= 0) return "var(--bg3)";
  if (count === 1) return "rgba(61,214,140,0.25)";
  if (count <= 3) return "rgba(61,214,140,0.5)";
  if (count <= 5) return "rgba(61,214,140,0.75)";
  return "#3dd68c";
}

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

function DayDots({ days }: { days: JourneyDay[] }) {
  return (
    <div className="day-dots">
      {days.map((d, i) => (
        <span
          key={d.date}
          className={`day-dot${d.active ? " on" : ""}`}
          title={`${d.date}: ${d.attempts} attempt${d.attempts === 1 ? "" : "s"}`}
        >
          {DAY_LETTERS[i % 7]}
        </span>
      ))}
    </div>
  );
}

/* ---------------- Pattern rings ---------------- */

const TIER_META: Record<PatternRing["tier"], { label: string; color: string }> = {
  none: { label: "Unranked", color: "var(--muted)" },
  bronze: { label: "Bronze", color: "#cd7f32" },
  silver: { label: "Silver", color: "#c0c0c0" },
  gold: { label: "Gold", color: "#ffd700" },
  mastered: { label: "Mastered", color: "url(#masterGrad)" },
};

function RingCard({ ring }: { ring: PatternRing }) {
  const meta = TIER_META[ring.tier];
  const r = 26;
  const circ = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, ring.mastery));
  return (
    <div className={`ring-card${ring.tier === "none" ? " unranked" : ""}`}>
      <svg className="ring-svg" width="72" height="72" viewBox="0 0 72 72">
        <circle className="ring-track" cx="36" cy="36" r={r} strokeWidth="8" />
        <circle
          className="ring-prog"
          cx="36" cy="36" r={r} strokeWidth="8"
          stroke={meta.color}
          strokeDasharray={`${frac * circ} ${circ}`}
        />
      </svg>
      <div className="rname">{ring.pattern}</div>
      <div className="rtier" style={{ color: ring.tier === "none" ? "var(--muted)" : meta.color === "url(#masterGrad)" ? "#ffd700" : meta.color }}>
        {meta.label}
      </div>
      <div className="rstats">
        {Math.round(ring.mastery * 100)}% · {ring.solved}/{ring.attempted} solved
      </div>
    </div>
  );
}

/* ---------------- Achievements ---------------- */

function AchCard({ a }: { a: Achievement }) {
  const unlocked = a.unlockedAt !== null;
  return (
    <div className={`ach ${unlocked ? "unlocked" : "locked"}`}>
      <div className="aname">{unlocked ? "🏆 " : ""}{a.name}</div>
      <div className="adesc">{a.description}</div>
      {unlocked && <div className="adate">Unlocked {a.unlockedAt!.slice(0, 10)}</div>}
    </div>
  );
}

/* ---------------- Page ---------------- */

export default function Journey() {
  const [game, setGame] = useState<GameState | null>(null);

  useEffect(() => {
    api().getGameState().then(setGame).catch(() => {});
  }, []);

  // Full 120-day heatmap: columns = weeks
  const heat = useMemo(() => {
    if (!game) return null;
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const start = new Date(end);
    start.setDate(start.getDate() - 119);
    start.setDate(start.getDate() - start.getDay()); // align to Sunday
    const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    const nCols = Math.ceil(totalDays / 7);
    const cols: { date: string; count: number; future: boolean }[][] = [];
    for (let c = 0; c < nCols; c++) {
      const col: { date: string; count: number; future: boolean }[] = [];
      for (let r = 0; r < 7; r++) {
        const d = new Date(start);
        d.setDate(d.getDate() + c * 7 + r);
        const iso = d.toISOString().slice(0, 10);
        col.push({ date: iso, count: game.heatmap[iso] ?? 0, future: d > end });
      }
      cols.push(col);
    }
    return cols;
  }, [game]);

  const achievements = useMemo(() => {
    if (!game) return [];
    return [...game.achievements].sort((a, b) =>
      (a.unlockedAt ? 0 : 1) - (b.unlockedAt ? 0 : 1)
    );
  }, [game]);

  return (
    <div>
      <h1>Your journey</h1>
      <p className="sub">Eight weeks of training, mapped. Rings earned. Trophies ahead.</p>

      {/* ---------- 8-week journey map ---------- */}
      <div className="section-head">
        <h2>Journey map</h2>
        {game && game.journey.weeks.length > 0 && (
          <span className="small">Week {game.journey.currentWeek} of {game.journey.weeks.length}</span>
        )}
      </div>
      {game && game.journey.weeks.length === 0 && (
        <div className="card empty-note">
          <span className="small">Generate your plan from the Dashboard/Settings to light up the journey map.</span>
        </div>
      )}
      {game && game.journey.weeks.length > 0 && (
        <div className="journey-timeline">
          {game.journey.weeks.map((w) => (
            <div
              key={w.week}
              className={`card jstage${w.isCurrent ? " current" : ""}${w.isPast ? " past" : ""}`}
            >
              <span className="node" />
              <div className="week-tag">Week {w.week}{w.isCurrent ? " · current" : ""}</div>
              <h3>{w.title}</h3>
              <div className="focus">{w.focus}</div>
              <DayDots days={w.days} />
            </div>
          ))}
        </div>
      )}

      {/* ---------- Pattern rings ---------- */}
      <h2>Pattern rings</h2>
      {game && game.rings.length === 0 && (
        <div className="card"><span className="small">No patterns yet — they'll appear as you attempt problems.</span></div>
      )}
      {game && game.rings.length > 0 && (
        <>
          <svg width="0" height="0" style={{ position: "absolute" }}>
            <defs>
              <linearGradient id="masterGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3dd68c" />
                <stop offset="100%" stopColor="#ffd700" />
              </linearGradient>
            </defs>
          </svg>
          <div className="rings-grid">
            {game.rings.map((r) => <RingCard key={r.pattern} ring={r} />)}
          </div>
        </>
      )}

      {/* ---------- Achievements ---------- */}
      <h2>Achievements</h2>
      {game && achievements.length === 0 && (
        <div className="card"><span className="small">No achievements defined yet — keep training.</span></div>
      )}
      {game && achievements.length > 0 && (
        <div className="ach-grid">
          {achievements.map((a) => <AchCard key={a.id} a={a} />)}
        </div>
      )}

      {/* ---------- Full heatmap ---------- */}
      <h2>Activity</h2>
      <div className="card">
        <div className="section-head">
          <h3>Last 120 days</h3>
          <span className="small">attempts per day</span>
        </div>
        {heat && (
          <>
            <div className="heatmap-full">
              {heat.flat().map((c) => (
                <span
                  key={c.date}
                  className={`cell${c.future ? " future" : ""}`}
                  title={c.future ? "" : `${c.date}: ${c.count} attempt${c.count === 1 ? "" : "s"}`}
                  style={{ background: c.future ? undefined : heatColor(c.count) }}
                />
              ))}
            </div>
            <div className="heat-legend small">
              Less
              {[0, 1, 3, 5, 8].map((c) => (
                <span key={c} className="cell" style={{ background: heatColor(c) }} />
              ))}
              More
            </div>
          </>
        )}
      </div>
    </div>
  );
}
