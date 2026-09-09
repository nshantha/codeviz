import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import type {
  Achievement,
  BehavioralQuestion,
  Company,
  MockKind,
  MockSession,
  Profile,
  Question,
  TutorTurn,
} from "../../../shared/types";
import { COMPANY_LABELS } from "../../../shared/types";
import { Celebration, type CelebrationData } from "../components/Celebration";
import "../ai.css";

const KIND_META: Record<MockKind, { label: string; minutes: number; blurb: string }> = {
  coding: { label: "Coding", minutes: 45, blurb: "45 min · one problem, timed, no help" },
  "system-design": { label: "System design", minutes: 30, blurb: "30 min · verbal walkthrough" },
  behavioral: { label: "Behavioral", minutes: 20, blurb: "20 min · one company question" },
};

type Phase = "setup" | "live" | "debrief";

interface Selection {
  kind: MockKind;
  reference: string;
  label: string;
  question?: Question;
  questionId?: number;
  prompt?: string;
  company?: Company;
}

function fmtClock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function scoreClass(score: number | null): string {
  if (score === null) return "";
  if (score >= 80) return "hi";
  if (score >= 60) return "mid";
  return "lo";
}

export default function Mock({ profile, go }: { profile: Profile; go: (p: string, arg?: unknown) => void }) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [kind, setKind] = useState<MockKind>("coding");
  const [sel, setSel] = useState<Selection | null>(null);
  const [debrief, setDebrief] = useState<{ session: MockSession; text: string; newAchievements: Achievement[] } | null>(null);
  const [past, setPast] = useState<MockSession[]>([]);

  useEffect(() => {
    api().listMockSessions().then(setPast).catch(() => {});
  }, [phase]);

  return (
    <div>
      <button className="btn ghost small" onClick={() => go("dashboard")}>← Dashboard</button>
      <h1>Friday Mock <span className="small" style={{ fontWeight: 400 }}>— the weekly boss fight</span></h1>
      <p className="sub">
        A timed AI interviewer runs the round with zero teaching, then scores you with a debrief.
        Pick your fight below; past mocks and scores are at the bottom.
      </p>

      {phase === "setup" && (
        <Setup
          kind={kind} setKind={setKind} profile={profile}
          onStart={(s) => { setSel(s); setDebrief(null); setPhase("live"); }}
        />
      )}
      {phase === "live" && sel && (
        <Live
          key={`${sel.kind}-${sel.reference}`}
          sel={sel} profile={profile}
          onDone={(d) => { setDebrief(d); setPhase("debrief"); }}
          onAbort={() => setPhase("setup")}
        />
      )}
      {phase === "debrief" && debrief && (
        <DebriefView debrief={debrief} onAgain={() => setPhase("setup")} />
      )}
      {phase === "debrief" && !debrief && (
        <div className="card"><span className="small">Scoring your mock…</span></div>
      )}

      <PastMocks past={past} />
    </div>
  );
}

/* ------------------------------------------------------------------ setup */

function Setup({ kind, setKind, profile, onStart }: {
  kind: MockKind; setKind: (k: MockKind) => void; profile: Profile;
  onStart: (sel: Selection) => void;
}) {
  const company: Company = profile.targetCompanies[0] ?? "meta";
  const [suggested, setSuggested] = useState<Question[]>([]);
  const [all, setAll] = useState<Question[]>([]);
  const [query, setQuery] = useState("");
  const [prompts, setPrompts] = useState<{ prompt: string }[]>([]);
  const [questions, setQuestions] = useState<BehavioralQuestion[]>([]);
  const [sel, setSel] = useState<Selection | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => { setSel(null); }, [kind]);

  useEffect(() => {
    if (kind === "coding") {
      api().getNextUp(10).then((items) => {
        setSuggested(items.filter((i) => i.questionId != null && i.question).slice(0, 3).map((i) => i.question as Question));
      }).catch(() => {});
      api().listQuestions({ companies: profile.targetCompanies }).then(setAll).catch(() => {});
    } else if (kind === "system-design") {
      api().listDesignPrompts(company).then((ps) => setPrompts(ps.map((p) => ({ prompt: p.prompt })))).catch(() => {});
    } else {
      api().listBehavioralQuestions(company).then(setQuestions).catch(() => {});
    }
  }, [kind, company, profile.targetCompanies]);

  const filtered = query.trim()
    ? all.filter((q) => `${q.title} ${q.pattern}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 12)
    : [];

  const pickCoding = (q: Question): Selection => ({
    kind: "coding", reference: String(q.leetcodeId), label: `${q.leetcodeId}. ${q.title}`,
    question: q, questionId: q.leetcodeId,
  });

  const begin = () => {
    if (!sel || starting) return;
    setStarting(true);
    onStart(sel);
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>1. Choose your round</h3>
      <div className="mock-kinds">
        {(Object.keys(KIND_META) as MockKind[]).map((k) => (
          <button key={k} className={`mock-kind ${kind === k ? "on" : ""}`} onClick={() => setKind(k)}>
            <div className="k-title">{KIND_META[k].label}</div>
            <div className="k-sub">{KIND_META[k].blurb}</div>
          </button>
        ))}
      </div>

      <h3>2. Pick the material</h3>
      {kind === "coding" && (
        <div>
          {suggested.length > 0 && (
            <>
              <div className="small" style={{ marginBottom: 6 }}>Suggested from your queue:</div>
              <div className="mock-pick">
                {suggested.map((q) => (
                  <div key={q.leetcodeId} className={`qrow ${sel?.questionId === q.leetcodeId ? "sel" : ""}`}
                    onClick={() => setSel(pickCoding(q))}>
                    <span className="title">{q.leetcodeId}. {q.title}</span>
                    <span className="meta"><span className={`badge ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span> {q.pattern}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <label className="field">
            <span>Or search the bank</span>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. subarray, graph, binary search…" />
          </label>
          {filtered.length > 0 && (
            <div className="mock-pick">
              {filtered.map((q) => (
                <div key={q.leetcodeId} className={`qrow ${sel?.questionId === q.leetcodeId ? "sel" : ""}`}
                  onClick={() => setSel(pickCoding(q))}>
                  <span className="title">{q.leetcodeId}. {q.title}</span>
                  <span className="meta"><span className={`badge ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span> {q.pattern}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {kind === "system-design" && (
        <div className="mock-pick">
          <div className="small">{COMPANY_LABELS[company]} prompts:</div>
          {prompts.map((p, i) => (
            <div key={i} className={`qrow ${sel?.prompt === p.prompt ? "sel" : ""}`}
              onClick={() => setSel({ kind, reference: p.prompt, label: p.prompt, prompt: p.prompt, company })}>
              <span className="title">{p.prompt}</span>
            </div>
          ))}
        </div>
      )}
      {kind === "behavioral" && (
        <div className="mock-pick">
          <div className="small">{COMPANY_LABELS[company]} questions:</div>
          {questions.map((q, i) => (
            <div key={i} className={`qrow ${sel?.reference === q.question ? "sel" : ""}`}
              onClick={() => setSel({ kind, reference: q.question, label: q.question, company })}>
              <span className="title">{q.question}</span>
              {q.tags.length > 0 && <span className="meta">{q.tags.join(" · ")}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn" disabled={!sel || starting} onClick={begin}>
          {sel ? `Start ${KIND_META[kind].label} mock →` : "Select material above"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- live */

function Live({ sel, profile, onDone, onAbort }: {
  sel: Selection; profile: Profile;
  onDone: (d: { session: MockSession; text: string; newAchievements: Achievement[] }) => void;
  onAbort: () => void;
}) {
  const totalMs = KIND_META[sel.kind].minutes * 60 * 1000;
  const [deadline] = useState(() => Date.now() + totalMs);
  const startedAt = useRef(new Date().toISOString());
  const [remaining, setRemaining] = useState(totalMs);
  const [chat, setChat] = useState<TutorTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ending, setEnding] = useState(false);
  const endedRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Countdown.
  useEffect(() => {
    const t = setInterval(() => setRemaining(Math.max(0, deadline - Date.now())), 250);
    return () => clearInterval(t);
  }, [deadline]);

  const openerText = () => {
    if (sel.kind === "coding" && sel.question) {
      const q = sel.question;
      return `Begin the timed mock. The candidate will solve LeetCode ${q.leetcodeId} "${q.title}" (${q.difficulty}, ${q.pattern}). Run this like a real ${KIND_META.coding.minutes}-minute Meta coding round: state the problem, then interview.`;
    }
    if (sel.kind === "system-design" && sel.prompt) {
      return `Begin the timed mock. The design prompt is: "${sel.prompt}". Run this like a real ${KIND_META["system-design"].minutes}-minute system design interview: let the candidate drive, withhold critique until checkpoints.`;
    }
    return `Begin the timed mock. The behavioral question is: "${sel.label}". Run this like a real ${KIND_META.behavioral.minutes}-minute behavioral round: probe for personal ownership and specifics.`;
  };

  // Opening turn from the interviewer.
  useEffect(() => {
    let cancelled = false;
    const open = async () => {
      setBusy(true);
      try {
        const res = await api().tutorChat({
          kind: sel.kind,
          mode: "mock",
          questionId: sel.questionId,
          prompt: sel.prompt,
          history: [],
          userMessage: openerText(),
          context: {
            company: sel.company,
            elapsedMs: 0,
            ...(sel.kind === "coding" && sel.question ? { pattern: sel.question.pattern, difficulty: sel.question.difficulty } : {}),
          },
        });
        if (!cancelled) setChat([{ role: "tutor", text: res.reply, at: new Date().toISOString() }]);
      } catch (e) {
        if (!cancelled) setChat([{ role: "tutor", text: `Interviewer unavailable: ${e instanceof Error ? e.message : String(e)}`, at: new Date().toISOString() }]);
      } finally {
        if (!cancelled) setBusy(false);
      }
    };
    void open();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async () => {
    if (!input.trim() || busy || ending) return;
    const userTurn: TutorTurn = { role: "user", text: input, at: new Date().toISOString() };
    const history = [...chat, userTurn];
    setChat(history);
    setInput("");
    setBusy(true);
    try {
      const res = await api().tutorChat({
        kind: sel.kind,
        mode: "mock",
        questionId: sel.questionId,
        prompt: sel.prompt,
        history,
        userMessage: userTurn.text,
        context: {
          company: sel.company,
          elapsedMs: totalMs - remaining,
          ...(sel.kind === "coding" && sel.question ? { pattern: sel.question.pattern, difficulty: sel.question.difficulty } : {}),
        },
      });
      setChat([...history, { role: "tutor", text: res.reply, at: new Date().toISOString() }]);
    } catch (e) {
      setChat([...history, { role: "tutor", text: `Error: ${e instanceof Error ? e.message : String(e)}`, at: new Date().toISOString() }]);
    } finally {
      setBusy(false);
    }
  };

  const endAndDebrief = async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setEnding(true);
    const endedAt = new Date().toISOString();
    const durationMs = Date.now() - new Date(startedAt.current).getTime();
    try {
      const res = await api().tutorChat({
        kind: sel.kind,
        mode: "debrief",
        questionId: sel.questionId,
        prompt: sel.prompt,
        history: chat,
        userMessage: "Give the final debrief and score.",
        context: { company: sel.company, elapsedMs: durationMs },
      });
      const m = res.reply.match(/SCORE:\s*(\d{1,3})/i);
      const score = m ? Math.max(0, Math.min(100, parseInt(m[1], 10))) : null;
      const text = res.reply.replace(/SCORE:\s*\d{1,3}/i, "").trim();
      const saved = await api().saveMockSession({
        kind: sel.kind,
        reference: sel.reference,
        score,
        notes: res.reply,
        durationMs,
        startedAt: startedAt.current,
        endedAt,
      });
      onDone({ session: saved.session, text, newAchievements: saved.newAchievements });
    } catch (e) {
      const saved = await api().saveMockSession({
        kind: sel.kind,
        reference: sel.reference,
        score: null,
        notes: `Debrief failed: ${e instanceof Error ? e.message : String(e)}`,
        durationMs,
        startedAt: startedAt.current,
        endedAt,
      });
      onDone({ session: saved.session, text: "The debrief didn't come back — your session was saved anyway. Review the transcript above and retry later.", newAchievements: saved.newAchievements });
    }
  };

  // Auto-end when the clock hits zero.
  useEffect(() => {
    if (remaining <= 0 && !endedRef.current && chat.length > 0) void endAndDebrief();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const warn = remaining < 5 * 60 * 1000;

  return (
    <div className="card">
      <div className="mock-live-head">
        <div>
          <span className="live-dot" />
          <b>{KIND_META[sel.kind].label} mock</b>
          <div className="small" style={{ marginTop: 2 }}>{sel.label}</div>
          {sel.kind === "coding" && sel.question?.leetcodeUrl && (
            <div className="small"><a href={sel.question.leetcodeUrl} target="_blank" rel="noreferrer">Open problem ↗</a></div>
          )}
        </div>
        <div className={`countdown ${remaining <= 0 ? "dead" : warn ? "warn" : ""}`}>{fmtClock(remaining)}</div>
      </div>

      <div className="chat" style={{ maxHeight: 440 }}>
        {chat.map((m, i) => <div key={i} className={`msg ${m.role}`}>{m.text}</div>)}
        {chat.length === 0 && <span className="small">The interviewer is joining…</span>}
        <div ref={chatEndRef} />
      </div>
      <div className="row">
        <input
          type="text" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Talk through your thinking…" disabled={ending}
          onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
        />
        <button className="btn small" disabled={busy || ending || !input.trim()} onClick={() => void send()}>
          {busy ? "…" : "Send"}
        </button>
      </div>
      <div className="row" style={{ marginTop: 12, justifyContent: "space-between" }}>
        <button className="btn ghost small" disabled={ending} onClick={onAbort}>Abort (no save)</button>
        <button className="btn small" disabled={ending} onClick={() => void endAndDebrief()}>
          {ending ? "Scoring…" : "End & debrief"}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- debrief */

function DebriefView({ debrief, onAgain }: {
  debrief: { session: MockSession; text: string; newAchievements: Achievement[] };
  onAgain: () => void;
}) {
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const { session, text, newAchievements } = debrief;

  useEffect(() => {
    setCelebration({ newAchievements });
  }, [newAchievements]);

  const paragraphs = text.split(/\n{2,}|\n/).filter((p) => p.trim());

  return (
    <div>
      {celebration && <Celebration data={celebration} onDone={() => setCelebration(null)} />}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Debrief</h2>
        <div className="debrief-score">
          <div className="debrief-ring" style={{ ["--score" as string]: session.score ?? 0 }}>
            <span>{session.score ?? "—"}</span>
          </div>
          <div>
            <b>{KIND_META[session.kind]?.label ?? session.kind} mock</b>
            <div className="small">{session.reference.slice(0, 100)}</div>
            <div className="small">
              {session.durationMs ? `${Math.round(session.durationMs / 60000)} min` : ""} · {session.startedAt.slice(0, 10)}
            </div>
          </div>
        </div>
        <div className="debrief-text">
          {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn" onClick={onAgain}>Back to setup</button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- past list */

function PastMocks({ past }: { past: MockSession[] }) {
  if (past.length === 0) return null;
  return (
    <div style={{ marginTop: 24 }}>
      <h2>Past mocks ({past.length})</h2>
      {past.map((m) => (
        <div className="qrow" key={m.id}>
          <span className="title">{m.reference.slice(0, 90)}{m.reference.length > 90 ? "…" : ""}</span>
          <span className="meta">
            {KIND_META[m.kind]?.label ?? m.kind} · {m.startedAt.slice(0, 10)}
            {m.durationMs ? ` · ${Math.round(m.durationMs / 60000)}m` : ""}
          </span>
          {m.score !== null && <span className={`score-chip ${scoreClass(m.score)}`}>{m.score}</span>}
        </div>
      ))}
    </div>
  );
}
