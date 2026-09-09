import { useEffect, useState } from "react";
import { api } from "../api";
import type { Company, Profile, TutorProviderId, TutorProviderStatus } from "../../../shared/types";
import { COMPANIES, COMPANY_LABELS } from "../../../shared/types";
import "../ai.css";

const DIAGNOSTIC = [
  {
    q: "Sorted array, find two numbers summing to a target. Which pattern?",
    options: ["Sliding Window", "Two Pointers", "Binary Search", "Heap / Top-K"],
    answer: 1,
  },
  {
    q: "Count subarrays whose sum equals K (array has negatives). Which pattern?",
    options: ["Sliding Window", "Two Pointers", "Prefix Sum", "Greedy"],
    answer: 2,
  },
  {
    q: "Shortest path in an unweighted grid. Which approach?",
    options: ["Tree DFS", "Tree BFS", "Backtracking", "Dynamic Programming"],
    answer: 1,
  },
];

export default function Onboarding({ onDone }: { onDone: (p: Profile) => void }) {
  const [companies, setCompanies] = useState<Company[]>(["meta"]);
  const [interviewDate, setInterviewDate] = useState("");
  const [experienceYears, setExperienceYears] = useState(5);
  const [language, setLanguage] = useState("Python");
  const [minutesPerDay, setMinutesPerDay] = useState(60);
  const [entryPoint, setEntryPoint] = useState<Profile["entryPoint"]>("basics");
  const [showDiag, setShowDiag] = useState(false);
  const [diagAnswers, setDiagAnswers] = useState<number[]>([-1, -1, -1]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleCompany = (c: Company) =>
    setCompanies((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const finish = async () => {
    if (companies.length === 0) {
      setError("Pick at least one target company.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const diagScore = showDiag && diagAnswers.every((a) => a >= 0)
        ? diagAnswers.filter((a, i) => a === DIAGNOSTIC[i].answer).length / DIAGNOSTIC.length
        : null;
      const profile = await api().saveProfile({
        targetCompanies: companies,
        interviewDate: interviewDate || null,
        experienceYears,
        language,
        minutesPerDay,
        entryPoint,
        diagnosticScore: diagScore,
        createdAt: "",
        updatedAt: "",
      });
      await api().regeneratePlan();
      onDone(profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="onboard">
      <div className="logo" style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
        Algo<span style={{ color: "var(--accent)" }}>Mentor</span>
      </div>
      <p className="sub">Local-first interview prep. Your data never leaves this machine unless you export it.</p>

      {error && <div className="err">{error}</div>}

      <div className="card">
        <h3>1. Target companies</h3>
        <div className="company-pick">
          {COMPANIES.map((c) => (
            <button key={c} className={companies.includes(c) ? "on" : ""} onClick={() => toggleCompany(c)}>
              {COMPANY_LABELS[c]}
            </button>
          ))}
        </div>
        <p className="small">Question banks, system design prompts, and behavioral questions adapt to these.</p>
      </div>

      <AiCoachStep />

      <div className="card">
        <h3>3. Your situation</h3>
        <div className="grid2">
          <label className="field">
            <span>Interview date (optional)</span>
            <input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
          </label>
          <label className="field">
            <span>Years of experience</span>
            <input type="number" min={0} max={30} value={experienceYears} onChange={(e) => setExperienceYears(Number(e.target.value))} />
          </label>
          <label className="field">
            <span>Preferred language</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {["Python", "Java", "C++", "JavaScript", "TypeScript", "Go"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Minutes per day</span>
            <input type="number" min={15} max={480} step={15} value={minutesPerDay} onChange={(e) => setMinutesPerDay(Number(e.target.value))} />
          </label>
        </div>
      </div>

      <div className="card">
        <h3>4. Where to start</h3>
        <div className="check-row">
          <input type="radio" name="entry" checked={entryPoint === "basics"} onChange={() => setEntryPoint("basics")} />
          <div><b>Basics gate</b> <span className="small">— 12 prerequisite drills first (recommended)</span></div>
        </div>
        <div className="check-row">
          <input type="radio" name="entry" checked={entryPoint === "core"} onChange={() => setEntryPoint("core")} />
          <div><b>Core patterns</b> <span className="small">— jump into the pattern ladder</span></div>
        </div>
        <div className="check-row">
          <input type="radio" name="entry" checked={entryPoint === "company"} onChange={() => setEntryPoint("company")} />
          <div><b>Company track</b> <span className="small">— start from your companies' high-frequency banks</span></div>
        </div>
        <div className="check-row" style={{ marginTop: 8 }}>
          <input type="checkbox" checked={showDiag} onChange={(e) => setShowDiag(e.target.checked)} />
          <div>Not sure? Take the <b>2-minute diagnostic</b> <span className="small">(optional pattern-recognition check)</span></div>
        </div>
        {showDiag && (
          <div style={{ marginTop: 12 }}>
            {DIAGNOSTIC.map((d, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ marginBottom: 6 }}>{i + 1}. {d.q}</div>
                {d.options.map((o, j) => (
                  <div className="check-row" key={j}>
                    <input type="radio" name={`diag-${i}`} checked={diagAnswers[i] === j} onChange={() => setDiagAnswers((a) => { const n = [...a]; n[i] = j; return n; })} />
                    <span>{o}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="btn" style={{ width: "100%", padding: 14 }} disabled={saving} onClick={finish}>
        {saving ? "Setting up…" : "Start my plan →"}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------- AI coach step */

function AiCoachStep() {
  const [providers, setProviders] = useState<TutorProviderStatus[]>([]);
  const [selected, setSelected] = useState<TutorProviderId>("none");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ps, cur] = await Promise.all([api().getTutorProviders(), api().getTutorProvider()]);
        setProviders(ps);
        setSelected(cur);
      } catch {
        // Non-fatal: the built-in coach always works. Leave defaults.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const choose = async (id: TutorProviderId) => {
    setSelected(id);
    try { await api().setTutorProvider(id); } catch { /* selection stays local */ }
  };

  const anyAvailable = providers.some((p) => p.available);

  return (
    <div className="card">
      <h3>2. AI coach</h3>
      <p className="small" style={{ marginTop: 0 }}>
        Train with AI for the AI round — Meta's coding round is AI-enabled; practice the way you'll perform.
        Picks up your locally authenticated CLI, or use the built-in coach. You can change this anytime in Settings.
      </p>
      {loading && <span className="small">Checking providers…</span>}
      {!loading && providers.map((p) => (
        <div className="provider-row" key={p.id}>
          <input type="radio" name="onboard-provider" checked={selected === p.id} onChange={() => void choose(p.id)} style={{ marginTop: 4 }} />
          <div>
            <div>
              <b>{p.label}</b>{" "}
              <span className={`badge ${p.available ? "easy" : ""}`}>{p.available ? "available" : "unavailable"}</span>
            </div>
            <div className="provider-detail">{p.detail}</div>
          </div>
        </div>
      ))}
      {!loading && !anyAvailable && (
        <div className="setup-help">
          <b>No AI provider found on this machine.</b> Set one up to unlock the full AI interviewer,
          or continue with the built-in coach — it always works offline.
          <ol>
            <li>
              <b>Claude Code:</b> <code className="cli-cmd">npm install -g @anthropic-ai/claude-code</code>,
              then run <code className="cli-cmd">claude</code> to log in.
            </li>
            <li>
              <b>Codex:</b> <code className="cli-cmd">npm install -g @openai/codex</code>,
              then run <code className="cli-cmd">codex</code> to log in.
            </li>
          </ol>
        </div>
      )}
      {!loading && (
        <button className="btn ghost" style={{ width: "100%", marginTop: 12 }} onClick={() => void choose("none")}>
          {selected === "none" ? "✓ Using built-in coach" : "Continue with built-in coach"}
        </button>
      )}
    </div>
  );
}
