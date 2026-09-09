import { useEffect, useState } from "react";
import { api, fmtDate } from "../api";
import type { Question, ReviewItem } from "../../../shared/types";

export default function Review({ go }: { go: (page: string, arg?: unknown) => void }) {
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [pairs, setPairs] = useState<{ a: string; b: string; why: string }[]>([]);
  const [pairQuestions, setPairQuestions] = useState<Question[]>([]);
  const [activePair, setActivePair] = useState<{ a: string; b: string; why: string } | null>(null);

  useEffect(() => {
    api().getReviewQueue().then(setQueue).catch(() => {});
    api().getConfusablePairs().then(setPairs).catch(() => {});
  }, []);

  const drillPair = async (pair: { a: string; b: string; why: string }) => {
    setActivePair(pair);
    const qs = await api().listQuestions({ patterns: [pair.a, pair.b] });
    // interleave: alternate between the two patterns
    const a = qs.filter((q) => q.pattern === pair.a);
    const b = qs.filter((q) => q.pattern === pair.b);
    const mixed: Question[] = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i]) mixed.push(a[i]);
      if (b[i]) mixed.push(b[i]);
    }
    setPairQuestions(mixed.slice(0, 12));
  };

  const now = new Date();
  const due = queue.filter((r) => new Date(r.nextReview) <= now);

  return (
    <div>
      <h1>Review queue</h1>
      <p className="sub">{due.length} due now · {queue.length} scheduled total. Reviews use hidden labels — identify the pattern yourself.</p>

      <h2>Due now</h2>
      {due.length === 0 && <div className="card"><span className="small">Nothing due. New attempts schedule their own reviews automatically.</span></div>}
      {due.map((r) => (
        <div className="qrow" key={r.questionId} onClick={() => go("practice", r.questionId)}>
          <span className={`badge ${(r.overdueDays ?? 0) > 0 ? "hard" : "gaps"}`}>
            {(r.overdueDays ?? 0) > 0 ? `${r.overdueDays}d overdue` : "due"}
          </span>
          <span className="title">#{r.questionId} {r.question?.title}</span>
          <span className="meta">last: {r.lastOutcome ?? "—"} · lapses: {r.lapses}</span>
        </div>
      ))}

      <h2>Upcoming</h2>
      {queue.filter((r) => new Date(r.nextReview) > now).slice(0, 8).map((r) => (
        <div className="qrow" key={r.questionId} onClick={() => go("practice", r.questionId)}>
          <span className="badge">{fmtDate(r.nextReview)}</span>
          <span className="title">#{r.questionId} {r.question?.title}</span>
          <span className="meta">interval {r.intervalDays}d</span>
        </div>
      ))}

      <h2>Confusable-pair drills</h2>
      <p className="sub">The interview tests <i>discrimination</i>: knowing which pattern applies. These drills force the choice.</p>
      {pairs.map((p, i) => (
        <div className="card" key={i}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>{p.a} <span className="small">vs</span> {p.b}</h3>
            <button className="btn small" onClick={() => void drillPair(p)}>Drill →</button>
          </div>
          <p className="small">{p.why}</p>
          {activePair === p && pairQuestions.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {pairQuestions.map((q) => (
                <div className="qrow" key={q.leetcodeId} onClick={() => go("practice", q.leetcodeId)}>
                  <span className={`badge ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                  <span className="title">#{q.leetcodeId} {q.title}</span>
                  <span className="meta">pattern hidden — you decide</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
