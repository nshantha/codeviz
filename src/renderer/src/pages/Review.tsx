import { useCallback, useEffect, useMemo, useState } from "react";
import { api, fmtDate } from "../api";
import type { PatternInfo, Question, ReviewItem } from "../../../shared/types";
import { Celebration, type CelebrationData } from "../components/Celebration";
import "../practice.css";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Confusable { a: string; b: string; why: string; }

export default function Review({ go }: { go: (page: string, arg?: unknown) => void }) {
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [pairs, setPairs] = useState<Confusable[]>([]);
  const [pairQuestions, setPairQuestions] = useState<Question[]>([]);
  const [activePair, setActivePair] = useState<Confusable | null>(null);
  const [pairDone, setPairDone] = useState<Set<string>>(new Set());
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api().getReviewQueue().then(setQueue).catch(() => {});
    api().getConfusablePairs().then(setPairs).catch(() => {});
  }, []);

  const drillPair = async (pair: Confusable) => {
    setActivePair(pair);
    setError("");
    try {
      const qs = await api().listQuestions({ patterns: [pair.a, pair.b] });
      const a = qs.filter((q) => q.pattern === pair.a);
      const b = qs.filter((q) => q.pattern === pair.b);
      const mixed: Question[] = [];
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (a[i]) mixed.push(a[i]);
        if (b[i]) mixed.push(b[i]);
      }
      setPairQuestions(mixed.slice(0, 12));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const markDrillComplete = async (pair: Confusable) => {
    setError("");
    try {
      const r = await api().recordDrillCompletion(pair.a, pair.b);
      setPairDone((s) => new Set(s).add(`${pair.a}|${pair.b}`));
      setCelebration({ newAchievements: r.unlocked });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const now = new Date();
  const due = queue.filter((r) => new Date(r.nextReview) <= now);
  const upcoming = queue.filter((r) => new Date(r.nextReview) > now);

  return (
    <div>
      <Celebration data={celebration} onDone={() => setCelebration(null)} />
      <h1>Review queue</h1>
      <p className="sub">{due.length} due now · {queue.length} scheduled total. Reviews use hidden labels — identify the pattern yourself.</p>
      {error && <div className="err">{error}</div>}

      <h2>Due now</h2>
      {due.length === 0 ? (
        <div className="card"><span className="small">Nothing due. New attempts schedule their own reviews automatically.</span></div>
      ) : (
        <CardDeck due={due} go={go} />
      )}

      <h2>Upcoming</h2>
      {upcoming.slice(0, 8).map((r) => (
        <div className="qrow" key={r.questionId} onClick={() => go("practice", { questionId: r.questionId, hideLabels: true })}>
          <span className="badge">{fmtDate(r.nextReview)}</span>
          <span className="title">#{r.questionId} {r.question?.title ?? "…"}</span>
          <span className="meta">interval {r.intervalDays}d</span>
        </div>
      ))}

      <h2>Confusable-pair drills</h2>
      <p className="sub">The interview tests <i>discrimination</i>: knowing which pattern applies. These drills force the choice.</p>
      {pairs.map((p, i) => (
        <div className="card" key={i}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>{p.a} <span className="small">vs</span> {p.b}</h3>
            <div className="row">
              {pairDone.has(`${p.a}|${p.b}`) && <span className="ok small">✓ completed</span>}
              <button className="btn small" onClick={() => void drillPair(p)}>Drill →</button>
            </div>
          </div>
          <p className="small">{p.why}</p>
          {activePair === p && pairQuestions.length > 0 && (
            <div style={{ marginTop: 8 }} className="fade-in">
              {pairQuestions.map((q) => (
                <div className="qrow" key={q.leetcodeId} onClick={() => go("practice", { questionId: q.leetcodeId, hideLabels: true })}>
                  <span className={`badge ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                  <span className="title">#{q.leetcodeId} {q.title}</span>
                  <span className="meta">pattern hidden — you decide</span>
                </div>
              ))}
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn ghost small" onClick={() => void markDrillComplete(p)}>Mark drill complete</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fast card deck over the due queue                                    */
/* ------------------------------------------------------------------ */

function CardDeck({ due, go }: { due: ReviewItem[]; go: (page: string, arg?: unknown) => void }) {
  const [order, setOrder] = useState<number[]>(() => shuffle(due.map((_, i) => i)));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [infoCache, setInfoCache] = useState<Record<string, PatternInfo>>({});

  const item = due[order[pos] ?? 0];
  const pattern = item?.question?.pattern ?? null;

  useEffect(() => {
    setFlipped(false);
    if (!pattern || infoCache[pattern]) return;
    api().getPattern(pattern).then((p) => {
      if (p) setInfoCache((c) => ({ ...c, [pattern]: p }));
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, order]);

  const prev = useCallback(() => {
    setPos((p) => (p - 1 + order.length) % order.length);
    setFlipped(false);
  }, [order.length]);

  const next = useCallback(() => {
    setPos((p) => (p + 1) % order.length);
    setFlipped(false);
  }, [order.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  const doShuffle = () => {
    setOrder(shuffle(due.map((_, i) => i)));
    setPos(0);
    setFlipped(false);
  };

  const info = pattern ? infoCache[pattern] : undefined;
  const dueBadge = (item?.overdueDays ?? 0) > 0 ? `${item?.overdueDays}d overdue` : "due";
  const difficulty = item?.question?.difficulty;

  const cardContent = useMemo(() => {
    if (!flipped) return null;
    return (
      <div>
        <p><b>Pattern:</b> {pattern}</p>
        {info && info.triggers.length > 0 && (
          <>
            <p className="small" style={{ marginBottom: 4 }}><b>Recognition triggers</b></p>
            <ul className="small triggers" style={{ marginTop: 0 }}>
              {info.triggers.slice(0, 4).map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </>
        )}
        <p className="small">last outcome: <b>{item?.lastOutcome ?? "—"}</b> · lapses: {item?.lapses} · interval: {item?.intervalDays}d</p>
      </div>
    );
  }, [flipped, pattern, info, item]);

  return (
    <div>
      <div className="deck-top">
        <span className="small">card {pos + 1} / {due.length} · <span className="kbd">←</span> <span className="kbd">→</span> navigate · <span className="kbd">space</span> flip</span>
        <button className="btn ghost small" onClick={doShuffle}>Shuffle</button>
      </div>
      <div className={`flipcard${flipped ? " flipped" : ""}`} onClick={() => setFlipped((f) => !f)}>
        <span className={`badge due-badge ${(item?.overdueDays ?? 0) > 0 ? "hard" : "gaps"}`}>{dueBadge}</span>
        {!flipped ? (
          <div className="face front">
            {difficulty && <span className={`badge ${difficulty.toLowerCase()}`}>{difficulty}</span>}
            <h3>#{item?.questionId} {item?.question?.title ?? "…"}</h3>
            <p className="small">Which pattern is this? Flip when you've decided.</p>
          </div>
        ) : (
          <div className="face back">{cardContent}</div>
        )}
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn ghost small" onClick={prev}>← Prev</button>
        <button className="btn small" onClick={() => setFlipped((f) => !f)}>{flipped ? "Unflip" : "Flip"}</button>
        <button className="btn ghost small" onClick={next}>Next →</button>
        <button className="btn" onClick={() => go("practice", { questionId: item?.questionId, hideLabels: true })}>
          Practice #{item?.questionId} →
        </button>
      </div>
    </div>
  );
}
