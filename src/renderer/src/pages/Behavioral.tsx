import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { BehavioralQuestion, Company, Profile, Story, TutorTurn } from "../../../shared/types";
import { COMPANIES, COMPANY_LABELS } from "../../../shared/types";
import "../ai.css";

export default function Behavioral({ profile }: { profile: Profile }) {
  const [company, setCompany] = useState<Company>(profile.targetCompanies[0] ?? "meta");
  const [questions, setQuestions] = useState<BehavioralQuestion[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [editing, setEditing] = useState<Partial<Story> | null>(null);
  const [interviewing, setInterviewing] = useState<Story | null>(null);

  useEffect(() => {
    api().listBehavioralQuestions(company).then(setQuestions).catch(() => {});
  }, [company]);
  useEffect(() => {
    api().listStories().then(setStories).catch(() => {});
  }, []);

  const refresh = () => api().listStories().then(setStories).catch(() => {});

  if (editing) {
    return <StoryEditor initial={editing} onDone={() => { setEditing(null); refresh(); }} />;
  }

  if (interviewing) {
    return <StoryInterview story={interviewing} company={company} onBack={() => setInterviewing(null)} />;
  }

  return (
    <div>
      <h1>Behavioral</h1>
      <p className="sub">Real stories only — the AI must never invent your experience. Bank STAR stories, rehearse them against company questions.</p>

      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Story bank ({stories.length})</h2>
        <button className="btn small" onClick={() => setEditing({ title: "" })}>+ New story</button>
      </div>
      {stories.length === 0 && <div className="card"><span className="small">No stories yet. Add 3-5 real stories from your work — conflicts, ambiguity, failures, results.</span></div>}
      {stories.map((s) => (
        <div className="card" key={s.id}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>{s.title}</h3>
            <div className="row">
              <button className="btn small" onClick={() => setInterviewing(s)}>🎙️ Mock interview</button>
              <button className="btn ghost small" onClick={() => { void api().rehearseStory(s.id).then(refresh); }}>
                Rehearse{s.rehearsalCount > 0 ? ` (${s.rehearsalCount})` : ""}
              </button>
              <button className="btn ghost small" onClick={() => setEditing(s)}>Edit</button>
              <button className="btn ghost small" onClick={() => { if (confirm("Delete this story?")) void api().deleteStory(s.id).then(refresh); }}>Delete</button>
            </div>
          </div>
          {s.competencies.length > 0 && <div style={{ marginTop: 6 }}>{s.competencies.map((c) => <span key={c} className="badge" style={{ marginRight: 6 }}>{c}</span>)}</div>}
          <p className="small">Last practiced: {s.lastPracticed ? s.lastPracticed.slice(0, 10) : "never"}</p>
        </div>
      ))}

      <h2>{COMPANY_LABELS[company]} questions</h2>
      <div className="company-pick">
        {COMPANIES.map((c) => (
          <button key={c} className={company === c ? "on" : ""} onClick={() => setCompany(c)}>{COMPANY_LABELS[c]}</button>
        ))}
      </div>
      {questions.map((q, i) => (
        <div className="card" key={i} style={{ padding: "10px 14px" }}>
          <div>{q.question}</div>
          {q.tags.length > 0 && <div style={{ marginTop: 4 }}>{q.tags.map((t) => <span key={t} className="badge" style={{ marginRight: 6 }}>{t}</span>)}</div>}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------- story mock interview */

function starText(s: Story): string {
  return [
    `Title: ${s.title}`,
    s.situation ? `Situation: ${s.situation}` : "",
    s.task ? `Task: ${s.task}` : "",
    s.action ? `Action: ${s.action}` : "",
    s.result ? `Result: ${s.result}` : "",
    s.competencies.length > 0 ? `Competencies: ${s.competencies.join(", ")}` : "",
  ].filter(Boolean).join("\n");
}

function StoryInterview({ story, company, onBack }: { story: Story; company: Company; onBack: () => void }) {
  const [chat, setChat] = useState<TutorTurn[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [busy, setBusy] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const sendChat = async (history: TutorTurn[], message: string) => {
    setBusy(true);
    try {
      const res = await api().tutorChat({
        kind: "behavioral",
        mode: "mock",
        prompt: starText(story),
        history,
        userMessage: message,
        context: { company },
      });
      setChat([...history, { role: "tutor", text: res.reply, at: new Date().toISOString() }]);
    } catch (e) {
      setChat([...history, { role: "tutor", text: `Error: ${e instanceof Error ? e.message : String(e)}`, at: new Date().toISOString() }]);
    } finally {
      setBusy(false);
    }
  };

  const begin = () => {
    const message = `Run a behavioral mock interview on my story below. Ask me the story as a question, then probe my answers. Never invent details about my experience — only work with what I tell you.\n\n${starText(story)}`;
    const history: TutorTurn[] = [{ role: "user", text: message, at: new Date().toISOString() }];
    setChat(history);
    void sendChat(history, message);
  };

  const ownershipCheck = () => {
    const message = "Ask me the hard ownership questions about this story — what did *I* personally do?";
    const history = [...chat, { role: "user" as const, text: message, at: new Date().toISOString() }];
    setChat(history);
    void sendChat(history, message);
  };

  const send = () => {
    if (!chatInput.trim()) return;
    const history = [...chat, { role: "user" as const, text: chatInput, at: new Date().toISOString() }];
    setChat(history);
    setChatInput("");
    void sendChat(history, history[history.length - 1].text);
  };

  return (
    <div>
      <button className="btn ghost small" onClick={onBack}>← Back to story bank</button>
      <h1 style={{ fontSize: 20, marginTop: 12 }}>🎙️ Mock interview: {story.title}</h1>
      <p className="sub">
        The interviewer probes for evidence and personal ownership — and never invents your experience.
        Answer in your own words, like you would in the round.
      </p>
      <div className="card">
        {chat.length === 0 && (
          <div className="row" style={{ marginBottom: 4 }}>
            <button className="btn" disabled={busy} onClick={begin}>Start interview</button>
          </div>
        )}
        {chat.length > 0 && (
          <div className="quick-actions">
            <button className="btn ghost small" disabled={busy} onClick={ownershipCheck}>
              🔍 Ownership check
            </button>
          </div>
        )}
        <div className="chat" style={{ maxHeight: 440 }}>
          {chat.map((m, i) => <div key={i} className={`msg ${m.role}`}>{m.text}</div>)}
          {chat.length === 0 && <span className="small">Press Start interview. The AI asks the questions — you answer.</span>}
          <div ref={chatEndRef} />
        </div>
        <div className="row">
          <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Answer the interviewer…"
            onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
          <button className="btn small" disabled={busy || !chatInput.trim()} onClick={send}>{busy ? "…" : "Send"}</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ story editor */

function StoryEditor({ initial, onDone }: { initial: Partial<Story>; onDone: () => void }) {
  const [s, setS] = useState<Partial<Story>>({ competencies: [], situation: "", task: "", action: "", result: "", ...initial });
  const [compInput, setCompInput] = useState("");
  const [chat, setChat] = useState<TutorTurn[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!s.title?.trim()) return;
    setSaving(true);
    await api().saveStory({ ...s, title: s.title.trim() });
    setSaving(false);
    onDone();
  };

  const probe = async () => {
    if (!chatInput.trim()) return;
    setBusy(true);
    const history = [...chat, { role: "user" as const, text: chatInput, at: new Date().toISOString() }];
    setChat(history);
    setChatInput("");
    try {
      const res = await api().tutorChat({
        kind: "behavioral",
        history,
        userMessage: chatInput,
        context: {},
      });
      setChat([...history, { role: "tutor", text: res.reply, at: new Date().toISOString() }]);
    } catch (e) {
      setChat([...history, { role: "tutor", text: `Error: ${e instanceof Error ? e.message : String(e)}`, at: new Date().toISOString() }]);
    } finally {
      setBusy(false);
    }
  };

  const addComp = () => {
    if (!compInput.trim()) return;
    setS({ ...s, competencies: [...(s.competencies ?? []), compInput.trim()] });
    setCompInput("");
  };

  const star = (key: "situation" | "task" | "action" | "result", label: string, hint: string) => (
    <label className="field">
      <span>{label} — <span className="small">{hint}</span></span>
      <textarea value={s[key] ?? ""} onChange={(e) => setS({ ...s, [key]: e.target.value })} />
    </label>
  );

  return (
    <div>
      <button className="btn ghost small" onClick={onDone}>← Back to story bank</button>
      <h1 style={{ fontSize: 20, marginTop: 12 }}>{initial.id ? "Edit story" : "New story"}</h1>
      <div className="grid2">
        <div>
          <label className="field">
            <span>Title</span>
            <input type="text" value={s.title ?? ""} onChange={(e) => setS({ ...s, title: e.target.value })} placeholder="e.g. Kafka migration under deadline" />
          </label>
          <label className="field">
            <span>Competencies (what this story proves)</span>
            <div className="row">
              <input type="text" value={compInput} onChange={(e) => setCompInput(e.target.value)} placeholder="e.g. resolving conflict" onKeyDown={(e) => { if (e.key === "Enter") addComp(); }} />
              <button className="btn ghost small" onClick={addComp}>Add</button>
            </div>
          </label>
          <div style={{ marginBottom: 12 }}>{(s.competencies ?? []).map((c) => (
            <span key={c} className="badge" style={{ marginRight: 6, cursor: "pointer" }}
              onClick={() => setS({ ...s, competencies: (s.competencies ?? []).filter((x) => x !== c) })}>{c} ✕</span>
          ))}</div>
          {star("situation", "Situation", "context in one or two sentences")}
          {star("task", "Task", "what was YOUR responsibility")}
          {star("action", "Action", "what YOU did — decisions, conflicts, specifics")}
          {star("result", "Result", "measurable outcome + what you learned")}
          <button className="btn" disabled={saving || !s.title?.trim()} onClick={() => void save()}>
            {saving ? "Saving…" : "Save story"}
          </button>
        </div>
        <div>
          <h2>Story prober</h2>
          <p className="small">Paste your draft answers here. The interviewer probes for evidence and personal ownership — and never invents details.</p>
          <div className="chat">
            {chat.map((m, i) => <div key={i} className={`msg ${m.role}`}>{m.text}</div>)}
            {chat.length === 0 && <span className="small">Describe your story and ask for probing questions.</span>}
          </div>
          <div className="row">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Tell your story…"
              onKeyDown={(e) => { if (e.key === "Enter") void probe(); }} />
            <button className="btn small" disabled={busy} onClick={() => void probe()}>{busy ? "…" : "Send"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
