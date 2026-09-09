import { useEffect, useRef, useState } from "react";
import { api, fmtMs } from "../api";
import type { AttemptOutcome, Company, Profile, Question, TutorTurn, TutorProviderId } from "../../../shared/types";
import { COMPANIES, COMPANY_LABELS } from "../../../shared/types";
import { Celebration, type CelebrationData } from "../components/Celebration";
import "../practice.css";

/** Timer that separates active time from elapsed (pauses on hide / manual pause). */
function useTimer() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [activeMs, setActiveMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const [running, setRunning] = useState(false);
  const startRef = useRef(0);
  const activeRef = useRef(0);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const now = Date.now();
      setElapsedMs(now - startRef.current);
      if (!paused) {
        activeRef.current += 1000;
        setActiveMs(activeRef.current);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running, paused]);

  const start = () => {
    startRef.current = Date.now();
    activeRef.current = 0;
    setElapsedMs(0);
    setActiveMs(0);
    setPaused(false);
    setRunning(true);
  };
  const stop = () => setRunning(false);
  return { elapsedMs, activeMs, paused, setPaused, running, start, stop };
}

function TimerBadge({ ms, label }: { ms: number; label: string }) {
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const str = `${hh > 0 ? hh + ":" : ""}${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return (
    <span><span className="small">{label} </span><span className="timer">{str}</span></span>
  );
}

/**
 * `initial` accepts:
 *  - a leetcodeId number (legacy: Review deep-links)
 *  - { pattern }             (Patterns page deep-link)
 *  - { questionId, hideLabels } (Review card deck deep-link into hidden-label mode)
 */
type InitialArg = number | { pattern?: string; questionId?: number; hideLabels?: boolean } | undefined;

function parseInitial(initial: unknown): InitialArg {
  if (typeof initial === "number") return initial;
  if (initial && typeof initial === "object") {
    const o = initial as { pattern?: string; questionId?: number; hideLabels?: boolean };
    if (typeof o.questionId === "number" || typeof o.pattern === "string" || typeof o.hideLabels === "boolean") return o;
  }
  return undefined;
}

export default function Practice({ profile, initial, go }: { profile: Profile; initial?: unknown; go: (page: string, arg?: unknown) => void }) {
  const init = parseInitial(initial);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [fCompanies, setFCompanies] = useState<Company[]>(profile.targetCompanies);
  const [fPattern, setFPattern] = useState<string>(typeof init === "object" ? (init.pattern ?? "") : "");
  const [fSection, setFSection] = useState("");
  const [hideLabels, setHideLabels] = useState<boolean>(
    typeof init === "object" ? (init.hideLabels ?? false) : false,
  );
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api().listPatterns().then((p) => setPatterns(p.map((x) => x.name))).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api()
      .listQuestions({ companies: fCompanies, patterns: fPattern ? [fPattern] : undefined, section: (fSection || undefined) as never })
      .then((q) => {
        setQuestions(q);
        const initId = typeof init === "number" ? init : init?.questionId;
        if (initId && !active) {
          const found = q.find((x) => x.leetcodeId === initId);
          if (found) {
            setActive(found);
          } else {
            // deep-link target outside the current filter: fetch directly
            api().getQuestion(initId).then((g) => { if (g) setActive(g); }).catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fCompanies.join(","), fPattern, fSection]);

  const filtered = questions.filter(
    (q) => !search || q.title.toLowerCase().includes(search.toLowerCase()) || String(q.leetcodeId).includes(search),
  );

  const toggleCompany = (c: Company) =>
    setFCompanies((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  if (active) {
    return <Workspace q={active} hideLabels={hideLabels} onBack={() => setActive(null)} profile={profile} go={go} />;
  }

  return (
    <div>
      <h1>Practice</h1>
      <p className="sub">{questions.length} questions in the current filter · from your companies' research banks.</p>

      <div className="card">
        <div className="company-pick">
          {COMPANIES.map((c) => (
            <button key={c} className={fCompanies.includes(c) ? "on" : ""} onClick={() => toggleCompany(c)}>
              {COMPANY_LABELS[c]}
            </button>
          ))}
        </div>
        <div className="grid3">
          <label className="field">
            <span>Pattern</span>
            <select value={fPattern} onChange={(e) => setFPattern(e.target.value)}>
              <option value="">All patterns</option>
              {patterns.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Bank section</span>
            <select value={fSection} onChange={(e) => setFSection(e.target.value)}>
              <option value="">All sections</option>
              <option value="core">Core overlap</option>
              <option value="gaps">Company gaps</option>
              <option value="breadth">Breadth</option>
            </select>
          </label>
          <label className="field">
            <span>Search</span>
            <input type="text" placeholder="title or #" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
        </div>
        <div className="check-row">
          <input type="checkbox" checked={hideLabels} onChange={(e) => setHideLabels(e.target.checked)} />
          <span><b>Mixed mode</b> <span className="small">— hide pattern labels, identify the pattern yourself</span></span>
        </div>
      </div>

      {loading && <p className="small">Loading…</p>}
      {filtered.map((q) => (
        <div className="qrow" key={q.leetcodeId} onClick={() => setActive(q)}>
          <span className={`badge ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
          {!hideLabels && <span className="badge">{q.pattern}</span>}
          <span className="title">#{q.leetcodeId} {q.title}</span>
          <span className="meta">{q.companies.map((t) => `${COMPANY_LABELS[t.company]}${t.section !== "core" ? ` (${t.section})` : ""}`).join(" · ")}</span>
        </div>
      ))}
      {!loading && filtered.length === 0 && <div className="card"><span className="small">No questions match this filter.</span></div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mental-trace stepper: step through code lines, track variable state */
/* ------------------------------------------------------------------ */

interface VarRow { id: string; name: string; value: string; }
interface TraceStep { line: number; code: string; vars: { name: string; value: string }[]; }

let varSeq = 0;
const newVar = (): VarRow => ({ id: `v${++varSeq}`, name: "", value: "" });

function MentalTrace({ code, onTrace }: { code: string; onTrace: (t: TraceStep[]) => void }) {
  const lines = code.split("\n");
  const [enabled, setEnabled] = useState(false);
  const [step, setStep] = useState(-1);
  const [vars, setVars] = useState<VarRow[]>([newVar()]);
  const logRef = useRef<TraceStep[]>([]);

  const record = (line: number, snapshot: VarRow[]) => {
    const entry: TraceStep = {
      line,
      code: lines[line] ?? "",
      vars: snapshot.filter((v) => v.name.trim()).map((v) => ({ name: v.name.trim(), value: v.value })),
    };
    const last = logRef.current[logRef.current.length - 1];
    if (!last || last.line !== entry.line || JSON.stringify(last.vars) !== JSON.stringify(entry.vars)) {
      logRef.current = [...logRef.current, entry];
      onTrace(logRef.current);
    }
  };

  const goStep = (next: number) => {
    const clamped = Math.max(-1, Math.min(lines.length - 1, next));
    setStep(clamped);
    if (clamped >= 0) record(clamped, vars);
  };

  const setVarField = (id: string, field: "name" | "value", value: string) => {
    setVars((prev) => {
      const next = prev.map((v) => (v.id === id ? { ...v, [field]: value } : v));
      if (step >= 0) record(step, next);
      return next;
    });
  };

  if (!enabled) {
    return (
      <div className="trace-bar">
        <button className="btn ghost small" onClick={() => setEnabled(true)}>Start mental trace</button>
        <span className="small">No-execution interviews: narrate your code line-by-line, tracking state on paper.</span>
      </div>
    );
  }

  return (
    <div>
      <div className="trace-bar">
        <button className="btn ghost small" onClick={() => setEnabled(false)}>Hide trace</button>
        <span className="small">Step through each line like the interviewer is watching. Update the table as you go.</span>
      </div>
      <div className="trace-lines">
        {lines.map((ln, i) => (
          <div key={i} className={`trace-line${i === step ? " cur" : ""}${i < step ? " done" : ""}`}>
            <span className="ln">{i + 1}</span><span>{ln || " "}</span>
          </div>
        ))}
      </div>
      <div className="trace-step-row">
        <button className="btn ghost small" disabled={step <= -1} onClick={() => goStep(step - 1)}>← Prev</button>
        <button className="btn ghost small" disabled={step >= lines.length - 1} onClick={() => goStep(step + 1)}>Next →</button>
        <span className="step-ind">line {step + 1} / {lines.length} · {logRef.current.length} traced step{logRef.current.length === 1 ? "" : "s"} logged</span>
      </div>
      <table className="vartable">
        <thead><tr><th className="vname">Variable</th><th className="vval">Value</th><th className="vdel"></th></tr></thead>
        <tbody>
          {vars.map((v) => (
            <tr key={v.id}>
              <td><input className="vname" placeholder="i, left, …" value={v.name} onChange={(e) => setVarField(v.id, "name", e.target.value)} /></td>
              <td><input className="vval" placeholder="0, 'ab', [1,2], …" value={v.value} onChange={(e) => setVarField(v.id, "value", e.target.value)} /></td>
              <td><button className="btn ghost small vdel" onClick={() => setVars((p) => p.filter((x) => x.id !== v.id))} disabled={vars.length === 1}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn ghost small" style={{ marginTop: 8 }} onClick={() => setVars((p) => [...p, newVar()])}>+ Add variable</button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Workspace                                                          */
/* ------------------------------------------------------------------ */

function formatTrace(log: TraceStep[]): string {
  if (log.length === 0) return "(no trace recorded)";
  return log.map((s, i) => {
    const vs = s.vars.map((v) => `${v.name}=${v.value}`).join(", ");
    return `step ${i + 1} [line ${s.line + 1}] ${s.code.trim()}${vs ? `  // ${vs}` : ""}`;
  }).join("\n");
}

function Workspace({ q, hideLabels, onBack, profile, go }: {
  q: Question; hideLabels: boolean; onBack: () => void; profile: Profile; go: (page: string, arg?: unknown) => void;
}) {
  const timer = useTimer();
  const [started, setStarted] = useState(false);
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const [traceLog, setTraceLog] = useState<TraceStep[]>([]);
  const [hintLevel, setHintLevel] = useState(0);
  const [chat, setChat] = useState<TutorTurn[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [tutorBusy, setTutorBusy] = useState(false);
  const [provider, setProvider] = useState<TutorProviderId | undefined>(undefined);
  const [showSubmit, setShowSubmit] = useState(false);
  const [outcome, setOutcome] = useState<AttemptOutcome>("solved");
  const [confidence, setConfidence] = useState(3);
  const [identified, setIdentified] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const [error, setError] = useState("");
  const startTimeRef = useRef("");

  useEffect(() => {
    api().getTutorProvider().then(setProvider).catch(() => setProvider(undefined));
  }, []);

  const begin = () => {
    startTimeRef.current = new Date().toISOString();
    timer.start();
    setStarted(true);
  };

  const sendCoach = async (message: string, level: number) => {
    if (!message.trim() && level === hintLevel) return;
    setTutorBusy(true);
    setError("");
    const history = [...chat];
    if (message.trim()) {
      history.push({ role: "user", text: message, at: new Date().toISOString() });
      setChat(history);
    }
    try {
      const res = await api().tutorChat({
        kind: "coding",
        questionId: q.leetcodeId,
        history,
        userMessage: message.trim() || "(requesting a hint)",
        context: {
          pattern: hideLabels ? undefined : q.pattern,
          difficulty: q.difficulty,
          elapsedMs: timer.activeMs,
          hintLevel: level,
          company: profile.targetCompanies[0],
        },
      });
      setChat([...history, { role: "tutor", text: res.reply, at: new Date().toISOString() }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setTutorBusy(false);
      setChatInput("");
    }
  };

  const requestHint = () => {
    const level = Math.min(hintLevel + 1, 5);
    setHintLevel(level);
    void sendCoach("", level);
  };

  const askCoach = () => {
    const msg =
      `I'm working on #${q.leetcodeId} ${q.title}. Here is my code so far:\n\n` +
      `${code.trim() || "(no code written yet)"}\n\n` +
      `My mental trace so far:\n${formatTrace(traceLog)}\n\n` +
      `Elapsed active time: ${fmtMs(timer.activeMs)}. ` +
      `Ask me ONE guiding Socratic question about my approach — do not reveal anything.`;
    void sendCoach(msg, hintLevel);
  };

  const explainMistake = () => {
    const msg =
      `Here is my code for #${q.leetcodeId} ${q.title}:\n\n${code.trim() || "(no code written yet)"}\n\n` +
      `Point at my mistake — which line is wrong and why — without rewriting the solution for me.`;
    void sendCoach(msg, hintLevel);
  };

  const quizComplexity = () => {
    void sendCoach(
      `Quiz me on the time and space complexity of my current approach for #${q.leetcodeId} ${q.title}. ` +
      `Ask me to state it and justify it first — do not give me the answer.`,
      hintLevel,
    );
  };

  const askEdgeCases = () => {
    void sendCoach(
      `I want to think about edge cases for #${q.leetcodeId} ${q.title}. ` +
      `Ask me about ONE edge case at a time — do not list them all at once.`,
      hintLevel,
    );
  };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const r = await api().recordAttempt({
        questionId: q.leetcodeId,
        startedAt: startTimeRef.current,
        endedAt: new Date().toISOString(),
        activeMs: timer.activeMs,
        elapsedMs: timer.elapsedMs,
        outcome,
        hintsUsed: hintLevel,
        confidence,
        patternIdentifiedUnaided: hideLabels ? identified : null,
        labelShown: !hideLabels,
        notes: `--- code ---\n${code}\n--- trace ---\n${formatTrace(traceLog)}\n--- notes ---\n${notes}`,
      });
      timer.stop();
      let newLevel: number | undefined;
      try {
        const gs = await api().getGameState();
        newLevel = gs.level;
      } catch { /* non-fatal */ }
      setCelebration({
        xpGained: r.xpGained,
        leveledUp: r.leveledUp,
        newLevel,
        newAchievements: r.newAchievements,
      });
      setResult(
        `Recorded: ${outcome} in ${fmtMs(timer.activeMs)} with ${hintLevel} hint${hintLevel === 1 ? "" : "s"}. ` +
        `Pattern mastery now ${Math.round(r.patternState.mastery * 100)}%. Next review: ${r.reviewItem.nextReview}.`,
      );
      setShowSubmit(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Celebration data={celebration} onDone={() => setCelebration(null)} />
      <button className="btn ghost small" onClick={onBack}>← Back to questions</button>
      <div className="row" style={{ justifyContent: "space-between", marginTop: 12 }}>
        <h1 style={{ margin: 0 }}>#{q.leetcodeId} {q.title}</h1>
        <span className={`badge ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
      </div>
      <p className="sub">
        {!hideLabels && <><span className="badge">{q.pattern}</span> · </>}
        <a href={q.leetcodeUrl} target="_blank" rel="noreferrer">Open on LeetCode ↗</a>
        <span className="small"> · solve there, trace here — no code execution in interview rehearsal</span>
      </p>

      {provider === "none" && (
        <div className="offline-banner">
          <span className="dot" />
          <span style={{ flex: 1 }}><b>Training offline</b> <span className="small">— connect Claude Code to train for Meta's AI round.</span></span>
          <button className="btn small" onClick={() => go("settings")}>Connect</button>
        </div>
      )}

      {error && <div className="err">{error}</div>}
      {result && <div className="card"><span className="ok">{result}</span></div>}

      {!started ? (
        <div className="card">
          <p>Read the problem on LeetCode first. When you're ready, start the timer — it pauses automatically when the app is backgrounded.</p>
          <button className="btn" onClick={begin}>Start timer</button>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <TimerBadge ms={timer.activeMs} label="active" />
              <TimerBadge ms={timer.elapsedMs} label="elapsed" />
              <button className="btn ghost small" onClick={() => timer.setPaused(!timer.paused)}>
                {timer.paused ? "Resume" : "Pause"}
              </button>
              <button className="btn small" onClick={() => setShowSubmit(true)}>Finish & record</button>
            </div>
            {timer.paused && <p className="small">Paused — background/away time doesn't count against you.</p>}
          </div>

          <div className="prac-wrap">
            <div className="prac-main">
              <h2>Code pad</h2>
              <textarea
                className="codepad"
                placeholder={`# ${profile.language} — draft your solution here\n# No execution: practice mental tracing like the real interview`}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <h2>Trace</h2>
              <MentalTrace code={code || "# write code above, then trace it"} onTrace={setTraceLog} />
              <h2>Notes</h2>
              <textarea placeholder="Scratch thoughts, plan, observations…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="coach card">
              <h3 style={{ marginTop: 0 }}>Coach</h3>
              <div className="coach-actions">
                <button className="btn small" disabled={tutorBusy} onClick={askCoach}>
                  {tutorBusy ? "Thinking…" : "Ask coach"}
                </button>
                <button className="btn ghost small" disabled={tutorBusy} onClick={requestHint}>
                  {tutorBusy ? "…" : `Hint (${hintLevel}/5)`}
                </button>
              </div>
              <div className="coach-actions">
                <button className="btn ghost small" disabled={tutorBusy || !code.trim()} onClick={explainMistake}>Explain my mistake</button>
                <button className="btn ghost small" disabled={tutorBusy} onClick={quizComplexity}>Quiz me: complexity</button>
                <button className="btn ghost small" disabled={tutorBusy} onClick={askEdgeCases}>Edge cases?</button>
              </div>
              <div className="chat">
                {chat.map((m, i) => (
                  <div key={i} className={`msg ${m.role}`}>{m.text}</div>
                ))}
                {chat.length === 0 && <span className="small">Ask the coach a question, or request a hint. It will ask what <i>you</i> think first.</span>}
              </div>
              <div className="row">
                <input
                  type="text"
                  placeholder="Ask the coach…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void sendCoach(chatInput, hintLevel); }}
                />
                <button className="btn small" disabled={tutorBusy} onClick={() => void sendCoach(chatInput, hintLevel)}>Send</button>
              </div>
            </div>
          </div>

          {showSubmit && (
            <div className="card">
              <h3>Record attempt</h3>
              <div className="grid2">
                <label className="field">
                  <span>Outcome</span>
                  <select value={outcome} onChange={(e) => setOutcome(e.target.value as AttemptOutcome)}>
                    <option value="solved">Solved</option>
                    <option value="partial">Partial</option>
                    <option value="gave_up">Gave up</option>
                  </select>
                </label>
                <label className="field">
                  <span>Confidence (1-5)</span>
                  <input type="number" min={1} max={5} value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} />
                </label>
              </div>
              {hideLabels && (
                <div className="check-row">
                  <input type="checkbox" checked={identified === true} onChange={(e) => setIdentified(e.target.checked ? true : false)} />
                  <span>I identified the pattern myself (without the label)</span>
                </div>
              )}
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn" disabled={submitting} onClick={() => void submit()}>
                  {submitting ? "Recording…" : "Record attempt"}
                </button>
                <button className="btn ghost" onClick={() => setShowSubmit(false)}>Keep working</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
