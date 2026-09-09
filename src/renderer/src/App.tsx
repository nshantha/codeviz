import { useEffect, useState } from "react";
import { api } from "./api";
import type { Profile } from "../../shared/types";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Patterns from "./pages/Patterns";
import Practice from "./pages/Practice";
import Review from "./pages/Review";
import Design from "./pages/Design";
import Behavioral from "./pages/Behavioral";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";

const NAV = [
  ["dashboard", "Dashboard"],
  ["patterns", "Patterns"],
  ["practice", "Practice"],
  ["review", "Review"],
  ["design", "System Design"],
  ["behavioral", "Behavioral"],
  ["progress", "Progress"],
  ["settings", "Settings"],
] as const;

type Page = (typeof NAV)[number][0];

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page>("dashboard");
  const [pageArg, setPageArg] = useState<unknown>(undefined);

  useEffect(() => {
    api().getProfile().then(setProfile).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const go = (p: string, arg?: unknown) => {
    setPage(p as Page);
    setPageArg(arg);
  };

  if (loading) return <div className="main"><p className="small">Loading…</p></div>;
  if (!profile || editing) {
    return (
      <div className="main" style={{ maxWidth: "100%" }}>
        <Onboarding
          onDone={(p) => {
            setProfile(p);
            setEditing(false);
            setPage("dashboard");
          }}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="sidebar">
        <div className="logo">Algo<span>Mentor</span></div>
        {NAV.map(([id, label]) => (
          <button key={id} className={`nav-btn ${page === id ? "active" : ""}`} onClick={() => go(id)}>
            {label}
          </button>
        ))}
        <div className="foot">Local-first · your data stays on this machine</div>
      </div>
      <div className="main">
        {page === "dashboard" && <Dashboard profile={profile} go={go} />}
        {page === "patterns" && <Patterns focus={pageArg} go={go} />}
        {page === "practice" && <Practice profile={profile} initial={pageArg} go={go} />}
        {page === "review" && <Review go={go} />}
        {page === "design" && <Design profile={profile} />}
        {page === "behavioral" && <Behavioral profile={profile} />}
        {page === "progress" && <Progress />}
        {page === "settings" && <Settings profile={profile} onProfile={() => setEditing(true)} />}
      </div>
    </div>
  );
}
