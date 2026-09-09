import { useEffect, useRef, useState } from "react";
import { api, fmtMs } from "../api";
import type { AttemptOutcome, Company, Profile, Question, TutorTurn } from "../../../shared/types";
import { COMPANIES, COMPANY_LABELS } from "../../../shared/types";

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

export default function Practice({ profile, initial, go }: { profile: Profile; initial?: unknown; go: (page: string, arg?: unknown) => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [fCompanies, setFCompanies] = useState<Company[]>(profile.targetCompanies);
  const [fPattern, setFPattern] = useState<string>((initial as { pattern?: string })?.pattern ?? "");
  const [fSection, setFSection] = useState("");
  const [hideLabels, setHideLabels] = useState(false);
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
        const initId = typeof initial === "number" ? initial : undefined;
        if (initId) {
          const found = q.find((x) => x.leetcodeId === initId);
          if (found) setActive(found);
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
    return <Workspace q={active} hideLabels={hideLabels} onBack={() => setActive(null)} profile={profile} />;
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

function Workspace({ q, hideLabels, onBack, profile }: { q: Question; hideLabels: boolean; onBack: () => void; profile: Profile }) {
  const timer = useTimer();
  const [started, setStarted] = useState(false);
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const [hintLevel, setHintLevel] = useState(0);
  const [chat, setChat] = useState<TutorTurn[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [tutorBusy, setTutorBusy] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [outcome, setOutcome] = useState<AttemptOutcome>("solved");
  const [confidence, setConfidence] = useState(3);
  const [identified, setIdentified] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const startTimeRef = useRef("");

  const begin = () => {
    startTimeRef.current = new Date().toISOString();
    timer.start();
    setStarted(true);
  };

  const sendChat = async (message: string, level: number) => {
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
    void sendChat("", level);
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
        notes: `--- code ---\n${code}\n--- notes ---\n${notes}`,
      });
      timer.stop();
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

          <div className="grid2">
            <div>
              <h2>Code pad</h2>
              <textarea
                style={{ minHeight: 320, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13 }}
                placeholder={`# ${profile.language} — draft your solution here\n# No execution: practice mental tracing like the real interview`}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <h2>Trace & notes</h2>
              <textarea placeholder="Manual trace: walk through your example input step by step…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
              <h2>Coach</h2>
              <div className="row">
                <button className="btn ghost small" disabled={tutorBusy} onClick={requestHint}>
                  {tutorBusy ? "Thinking…" : `Get hint (${hintLevel}/5)`}
                </button>
                <span className="small">Socratic — hints guide, never reveal.</span>
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
                  onKeyDown={(e) => { if (e.key === "Enter") void sendChat(chatInput, hintLevel); }}
                />
                <button className="btn small" disabled={tutorBusy} onClick={() => void sendChat(chatInput, hintLevel)}>Send</button>
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
