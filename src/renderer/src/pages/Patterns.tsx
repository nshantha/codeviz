import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { PatternInfo, Question } from "../../../shared/types";
import "../practice.css";

const BASICS = [
  ["big-o", "Big-O fluency", "Rank O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ); name an example of each."],
  ["arrays-strings", "Array & string mechanics", "Two-pointer in-place reverse; string immutability costs."],
  ["hashmap", "Hash map operations", "Insert/lookup/delete O(1); frequency-count any array."],
  ["linked-list-mech", "Linked list mechanics", "Reverse by hand; insert/delete given only the node."],
  ["stack-queue", "Stack & queue", "Bracket matching; implement one with the other."],
  ["recursion", "Recursion template", "Base + recursive case + combine; trace the call stack."],
  ["tree-traversal", "Tree traversals", "Pre/in/post-order from memory; level order with a queue."],
  ["bst-property", "BST property", "Validate with (low, high) bounds — not just parent checks."],
  ["graph-rep", "Graph representations", "Adjacency list vs matrix; DFS and BFS on a small graph."],
  ["sorting", "Sorting facts", "O(n log n) sorts; when counting/bucket sort applies."],
  ["binary-rep", "Binary & bit basics", "AND/OR/XOR/shifts; n & (n-1) clears the lowest set bit."],
  ["complexity-analysis", "Analyze any loop nest", "State time/space with justification in under a minute."],
] as const;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Patterns({ focus, go }: { focus?: unknown; go: (page: string, arg?: unknown) => void }) {
  const [patterns, setPatterns] = useState<PatternInfo[]>([]);
  const [open, setOpen] = useState<string | null>(typeof focus === "string" ? focus : null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"lessons" | "recognition" | "triggers">("lessons");

  useEffect(() => {
    api().listPatterns().then(setPatterns).catch(() => {});
  }, []);

  return (
    <div>
      <h1>Patterns</h1>
      <p className="sub">Recognition first: learn <i>when</i> a pattern applies, then drill it. Labels are hidden during mixed review.</p>

      <div className="drill-tabs">
        <button className={`tabbtn${tab === "lessons" ? " on" : ""}`} onClick={() => setTab("lessons")}>Lessons</button>
        <button className={`tabbtn${tab === "recognition" ? " on" : ""}`} onClick={() => setTab("recognition")}>Recognition drill</button>
        <button className={`tabbtn${tab === "triggers" ? " on" : ""}`} onClick={() => setTab("triggers")}>Trigger match</button>
      </div>

      {tab === "lessons" && (
        <>
          <h2>Basics gate</h2>
          <div className="card">
            <p className="small" style={{ marginTop: 0 }}>Check off each drill you can do cold. These unlock the ladder — be honest.</p>
            {BASICS.map(([id, title, check]) => (
              <div className="check-row" key={id}>
                <input
                  type="checkbox"
                  checked={checked.has(id)}
                  onChange={() => setChecked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; })}
                />
                <div><b>{title}</b> <span className="small">— {check}</span></div>
              </div>
            ))}
            <div className="small" style={{ marginTop: 8 }}>{checked.size}/12 complete</div>
            <div className="bar" style={{ marginTop: 6 }}><div style={{ width: `${(checked.size / 12) * 100}%`, background: "var(--accent2)" }} /></div>
          </div>

          <h2>Pattern ladder</h2>
          {patterns.map((p) => (
            <div className="card" key={p.name}>
              <div className="row" style={{ justifyContent: "space-between", cursor: "pointer" }} onClick={() => setOpen(open === p.name ? null : p.name)}>
                <h3 style={{ margin: 0 }}>{p.order}. {p.name}</h3>
                <span className="small">{open === p.name ? "▾" : "▸"}</span>
              </div>
              {open === p.name && (
                <div style={{ marginTop: 10 }}>
                  <p>{p.summary}</p>
                  <b>When to use this pattern</b>
                  <ul>{p.triggers.map((t, i) => <li key={i}>{t}</li>)}</ul>
                  <b>Common pitfalls</b>
                  <ul>{p.pitfalls.map((t, i) => <li key={i}>{t}</li>)}</ul>
                  <button className="btn small" onClick={() => go("practice", { pattern: p.name })}>Practice {p.name} →</button>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {tab === "recognition" && <RecognitionDrill patterns={patterns} go={go} />}
      {tab === "triggers" && <TriggerMatch patterns={patterns} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared drill machinery                                              */
/* ------------------------------------------------------------------ */

interface Confusable { a: string; b: string; why: string; }

function useDrillData(withQuestions: boolean) {
  const [patterns, setPatterns] = useState<PatternInfo[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pairs, setPairs] = useState<Confusable[]>([]);
  const [triggerCache, setTriggerCache] = useState<Record<string, PatternInfo>>({});

  useEffect(() => {
    api().listPatterns().then(setPatterns).catch(() => {});
    if (withQuestions) api().listQuestions({}).then(setQuestions).catch(() => {});
    api().getConfusablePairs().then(setPairs).catch(() => {});
  }, [withQuestions]);

  const getInfo = useCallback(async (name: string): Promise<PatternInfo | null> => {
    if (triggerCache[name]) return triggerCache[name];
    const p = await api().getPattern(name).catch(() => null);
    if (p) setTriggerCache((c) => ({ ...c, [name]: p }));
    return p;
  }, [triggerCache]);

  return { patterns, questions, pairs, getInfo, triggerCache };
}

/** 4 options: correct pattern + 3 distractors, preferring its confusable partners. */
function buildOptions(correct: string, all: string[], pairs: Confusable[]): string[] {
  const confusable: string[] = [];
  for (const p of pairs) {
    if (p.a === correct && !confusable.includes(p.b)) confusable.push(p.b);
    else if (p.b === correct && !confusable.includes(p.a)) confusable.push(p.a);
  }
  const pool = shuffle([...confusable, ...shuffle(all.filter((x) => x !== correct && !confusable.includes(x)))]);
  return shuffle([correct, ...pool.slice(0, 3)]);
}

/* ------------------------------------------------------------------ */
/* Recognition drill: question → which pattern?                         */
/* ------------------------------------------------------------------ */

function RecognitionDrill({ patterns, go }: { patterns: PatternInfo[]; go: (page: string, arg?: unknown) => void }) {
  const { questions, pairs, getInfo } = useDrillData(true);
  const [q, setQ] = useState<Question | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [rounds, setRounds] = useState(0);

  const patternNames = useMemo(() => patterns.map((p) => p.name), [patterns]);

  const next = useCallback(() => {
    if (questions.length === 0 || patternNames.length < 4) return;
    const nextQ = questions[Math.floor(Math.random() * questions.length)];
    setQ(nextQ);
    setOptions(buildOptions(nextQ.pattern, patternNames, pairs));
    setPicked(null);
    setTriggers([]);
  }, [questions, patternNames, pairs]);

  useEffect(() => { next(); }, [next]);

  const answer = async (name: string) => {
    if (!q || picked) return;
    setPicked(name);
    setRounds((r) => r + 1);
    setStreak((s) => (name === q.pattern ? s + 1 : 0));
    const info = await getInfo(q.pattern);
    if (info) setTriggers(info.triggers);
  };

  if (questions.length === 0 || patternNames.length === 0) {
    return <div className="card"><span className="small">Loading drill…</span></div>;
  }

  return (
    <div className="card fade-in">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>Which pattern fits?</h3>
        <span className="small">streak <span className="streak">{streak} 🔥</span> · round {rounds + 1}</span>
      </div>
      {q && (
        <>
          <p className="drill-q">#{q.leetcodeId} {q.title}</p>
          <div className="row">
            <span className={`badge ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
            <span className="small">{q.companies.slice(0, 3).map((t) => t.company).join(" · ")}</span>
          </div>
          <div className="opt-list">
            {options.map((o) => (
              <button
                key={o}
                className={`opt${picked ? (o === q.pattern ? " right" : o === picked ? " wrong" : "") : ""}`}
                disabled={!!picked}
                onClick={() => void answer(o)}
              >
                {o}
              </button>
            ))}
          </div>
          {picked && (
            <div className="drill-feedback fade-in">
              {picked === q.pattern ? (
                <span className="ok"><b>Correct.</b> Pattern: {q.pattern}</span>
              ) : (
                <span><span className="err" style={{ display: "inline-block", padding: "6px 10px", marginBottom: 0 }}>Not quite.</span> <b>Pattern: {q.pattern}</b></span>
              )}
              {triggers.length > 0 && (
                <ul className="small triggers" style={{ marginTop: 8 }}>
                  {triggers.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              )}
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn" onClick={next}>Next question →</button>
                <button className="btn ghost" onClick={() => go("practice", { questionId: q.leetcodeId, hideLabels: true })}>
                  Practice #{q.leetcodeId} hidden-label →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Trigger match: trigger statement → which pattern?                    */
/* ------------------------------------------------------------------ */

function TriggerMatch({ patterns }: { patterns: PatternInfo[] }) {
  const { pairs, getInfo, triggerCache } = useDrillData(false);
  const [pattern, setPattern] = useState<string | null>(null);
  const [trigger, setTrigger] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [rounds, setRounds] = useState(0);

  const patternNames = useMemo(() => patterns.map((p) => p.name), [patterns]);

  const next = useCallback(async () => {
    if (patternNames.length < 4) return;
    const name = patternNames[Math.floor(Math.random() * patternNames.length)];
    const info = triggerCache[name] ?? await getInfo(name);
    if (!info || info.triggers.length === 0) return;
    setPattern(name);
    setTrigger(info.triggers[Math.floor(Math.random() * info.triggers.length)]);
    setOptions(buildOptions(name, patternNames, pairs));
    setPicked(null);
  }, [patternNames, pairs, getInfo, triggerCache]);

  useEffect(() => { void next(); }, [next]);

  const answer = (name: string) => {
    if (!pattern || picked) return;
    setPicked(name);
    setRounds((r) => r + 1);
    setStreak((s) => (name === pattern ? s + 1 : 0));
  };

  if (patternNames.length === 0) {
    return <div className="card"><span className="small">Loading drill…</span></div>;
  }

  return (
    <div className="card fade-in">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>Match the trigger</h3>
        <span className="small">streak <span className="streak">{streak} 🔥</span> · round {rounds + 1}</span>
      </div>
      {pattern && (
        <>
          <p className="sub">Which pattern does this recognition trigger belong to?</p>
          <div className="hint-box">"{trigger}"</div>
          <div className="opt-list">
            {options.map((o) => (
              <button
                key={o}
                className={`opt${picked ? (o === pattern ? " right" : o === picked ? " wrong" : "") : ""}`}
                disabled={!!picked}
                onClick={() => answer(o)}
              >
                {o}
              </button>
            ))}
          </div>
          {picked && (
            <div className="drill-feedback fade-in">
              {picked === pattern ? (
                <span className="ok"><b>Correct</b> — "{trigger}" is a {pattern} signal.</span>
              ) : (
                <span><b>It was {pattern}.</b> <span className="small">File this trigger: "{trigger}".</span></span>
              )}
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn" onClick={() => void next()}>Next trigger →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
