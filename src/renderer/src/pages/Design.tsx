import { useEffect, useState } from "react";
import { api } from "../api";
import type { Company, DesignSession, Profile, TutorTurn } from "../../../shared/types";
import { COMPANIES, COMPANY_LABELS } from "../../../shared/types";

export default function Design({ profile }: { profile: Profile }) {
  const [company, setCompany] = useState<Company>(profile.targetCompanies[0] ?? "meta");
  const [prompts, setPrompts] = useState<{ prompt: string; company: Company | null; grading: string[] }[]>([]);
  const [sessions, setSessions] = useState<DesignSession[]>([]);
  const [active, setActive] = useState<DesignSession | null>(null);

  useEffect(() => {
    api().listDesignPrompts(company).then(setPrompts).catch(() => {});
    api().listDesignSessions().then(setSessions).catch(() => {});
  }, [company]);

  const startSession = async (prompt: string) => {
    const s = await api().saveDesignSession({ prompt, company });
    setSessions((prev) => [s, ...prev]);
    setActive(s);
  };

  if (active) {
    return <SessionEditor session={active} onBack={() => { setActive(null); api().listDesignSessions().then(setSessions).catch(() => {}); }} />;
  }

  return (
    <div>
      <h1>System design</h1>
      <p className="sub">At senior levels this round decides leveling. Practice verbal walkthroughs — no diagramming tool needed.</p>

      <div className="company-pick">
        {COMPANIES.map((c) => (
          <button key={c} className={company === c ? "on" : ""} onClick={() => setCompany(c)}>{COMPANY_LABELS[c]}</button>
        ))}
      </div>

      <h2>{COMPANY_LABELS[company]} prompts</h2>
      {prompts.map((p, i) => (
        <div className="card" key={i}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div style={{ flex: 1 }}>{p.prompt}</div>
            <button className="btn small" onClick={() => void startSession(p.prompt)}>Start session →</button>
          </div>
          {p.grading.length > 0 && <p className="small" style={{ marginBottom: 0 }}>Grading: {p.grading.join(" ")}</p>}
        </div>
      ))}

      <h2>Past sessions ({sessions.length})</h2>
      {sessions.map((s) => (
        <div className="qrow" key={s.id} onClick={() => setActive(s)}>
          <span className="title">{s.prompt.slice(0, 80)}</span>
          <span className="meta">{s.company ? COMPANY_LABELS[s.company] : ""} · {s.updatedAt.slice(0, 10)}{s.selfRating ? ` · ★${s.selfRating}` : ""}</span>
        </div>
      ))}
    </div>
  );
}

function SessionEditor({ session, onBack }: { session: DesignSession; onBack: () => void }) {
  const [s, setS] = useState(session);
  const [chat, setChat] = useState<TutorTurn[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    const updated = await api().saveDesignSession({ ...s, endedAt: s.endedAt ?? undefined });
    setS(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const askInterviewer = async () => {
    if (!chatInput.trim()) return;
    setBusy(true);
    const history = [...chat, { role: "user" as const, text: chatInput, at: new Date().toISOString() }];
    setChat(history);
    setChatInput("");
    try {
      const res = await api().tutorChat({
        kind: "system-design",
        prompt: s.prompt,
        history,
        userMessage: chatInput,
        context: { company: s.company ?? undefined },
      });
      setChat([...history, { role: "tutor", text: res.reply, at: new Date().toISOString() }]);
    } catch (e) {
      setChat([...history, { role: "tutor", text: `Error: ${e instanceof Error ? e.message : String(e)}`, at: new Date().toISOString() }]);
    } finally {
      setBusy(false);
    }
  };

  const field = (key: "requirements" | "estimates" | "decisions" | "tradeoffs" | "followups" | "feedback", label: string) => (
    <label className="field">
      <span>{label}</span>
      <textarea value={s[key]} onChange={(e) => setS({ ...s, [key]: e.target.value })} onBlur={() => void save()} />
    </label>
  );

  return (
    <div>
      <button className="btn ghost small" onClick={onBack}>← Back to prompts</button>
      <h1 style={{ fontSize: 20, marginTop: 12 }}>{s.prompt}</h1>
      <div className="grid2">
        <div>
          {field("requirements", "Requirements — users, operations, scale")}
          {field("estimates", "Capacity estimation — RPS, storage, bandwidth")}
          {field("decisions", "Architecture & key decisions")}
          {field("tradeoffs", "Trade-offs, failure modes, 10x question")}
          {field("followups", "Follow-up questions you'd ask")}
          {field("feedback", "Self-critique after the session")}
          <div className="row">
            <label className="field" style={{ width: 140 }}>
              <span>Self-rating (1-5)</span>
              <input type="number" min={1} max={5} value={s.selfRating ?? ""} onChange={(e) => setS({ ...s, selfRating: Number(e.target.value) || null })} onBlur={() => void save()} />
            </label>
            <button className="btn" onClick={() => void save()}>Save{saved ? " ✓" : ""}</button>
          </div>
        </div>
        <div>
          <h2>AI interviewer</h2>
          <p className="small">Withholds critique until checkpoints. Talk through your design out loud, then type the key points.</p>
          <div className="chat">
            {chat.map((m, i) => <div key={i} className={`msg ${m.role}`}>{m.text}</div>)}
            {chat.length === 0 && <span className="small">Ask the interviewer to begin, or present your requirements.</span>}
          </div>
          <div className="row">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Present your thinking…"
              onKeyDown={(e) => { if (e.key === "Enter") void askInterviewer(); }} />
            <button className="btn small" disabled={busy} onClick={() => void askInterviewer()}>{busy ? "…" : "Send"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
