import { useEffect, useState } from "react";
import { api } from "../api";
import type { ImportPreview, Profile, TutorProviderId, TutorProviderStatus } from "../../../shared/types";
import { COMPANY_LABELS } from "../../../shared/types";
import "../ai.css";

export default function Settings({ profile, onProfile }: { profile: Profile; onProfile: (p: Profile) => void }) {
  const [providers, setProviders] = useState<TutorProviderStatus[]>([]);
  const [selected, setSelected] = useState<TutorProviderId>("none");
  const [sync, setSync] = useState<{ folder: string | null; deviceId: string; pendingEvents: number; lastMerge: string | null } | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importFile, setImportFile] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [appInfo, setAppInfo] = useState<{ version: string; dataDir: string; deviceId: string } | null>(null);

  const refresh = () => {
    api().getTutorProviders().then(setProviders).catch(() => {});
    api().getTutorProvider().then(setSelected).catch(() => {});
    api().getSyncStatus().then(setSync).catch(() => {});
    api().getAppInfo().then(setAppInfo).catch(() => {});
  };
  useEffect(refresh, []);

  const say = (m: string) => { setMsg(m); setErr(""); setTimeout(() => setMsg(""), 4000); };
  const fail = (e: unknown) => setErr(e instanceof Error ? e.message : String(e));

  const chooseProvider = async (id: TutorProviderId) => {
    try { await api().setTutorProvider(id); setSelected(id); say("Tutor provider saved for this device."); }
    catch (e) { fail(e); }
  };

  const doExport = async () => {
    try {
      const file = await api().pickSaveFile(`algomentor-backup-${new Date().toISOString().slice(0, 10)}.algomentor`, [
        { name: "AlgoMentor backup", extensions: ["algomentor"] },
      ]);
      if (!file) return;
      const r = await api().exportBackup(file);
      say(`Backup exported: ${r.counts.attempts} attempts, ${r.counts.stories} stories.`);
    } catch (e) { fail(e); }
  };

  const doPreview = async () => {
    try {
      const file = await api().pickFile([{ name: "AlgoMentor backup", extensions: ["algomentor"] }]);
      if (!file) return;
      setImportFile(file);
      setPreview(await api().previewImport(file));
    } catch (e) { fail(e); }
  };

  const doImport = async (mode: "merge" | "replace") => {
    if (!importFile) return;
    try {
      const r = await api().importBackup(importFile, mode);
      say(`Imported (${mode}): ${r.imported.attempts} attempts, ${r.imported.stories} stories, ${r.imported.designSessions} design sessions. Mastery recomputed from merged log.`);
      setPreview(null);
      setImportFile(null);
    } catch (e) { fail(e); }
  };

  const chooseSyncFolder = async () => {
    try {
      const folder = await api().pickFolder();
      if (!folder) return;
      await api().setSyncFolder(folder);
      refresh();
      say("Sync folder set. This device will append to its own event log there.");
    } catch (e) { fail(e); }
  };

  const doSync = async () => {
    try {
      const r = await api().syncNow();
      refresh();
      say(`Sync merged ${r.merged} events${r.conflicts ? `, ${r.conflicts} conflict(s) kept as copies` : ""}.`);
    } catch (e) { fail(e); }
  };

  const resetOnboarding = async () => {
    if (!confirm("Edit your profile and regenerate the study plan? Your attempts and progress are kept.")) return;
    onProfile({ ...profile, createdAt: "" });
  };

  return (
    <div>
      <h1>Settings</h1>
      {msg && <div className="card"><span className="ok">{msg}</span></div>}
      {err && <div className="err">{err}</div>}

      <h2>AI tutor</h2>
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <p className="small" style={{ margin: 0, flex: 1 }}>
            Runs the <b>locally authenticated</b> CLI on this machine — your subscription, no API keys in AlgoMentor.
            Single-purpose Socratic calls only; the built-in coach always works offline.
          </p>
          <button className="btn ghost small" onClick={refresh}>Re-check</button>
        </div>
        <div className="small" style={{ marginBottom: 8 }}>
          Current: <b>{providers.find((p) => p.id === selected)?.label ?? "—"}</b>
        </div>
        {providers.map((p) => (
          <div className="provider-row" key={p.id}>
            <input type="radio" name="provider" checked={selected === p.id} onChange={() => void chooseProvider(p.id)} style={{ marginTop: 4 }} />
            <div>
              <div>
                <b>{p.label}</b>{" "}
                <span className={`badge ${p.available ? "easy" : ""}`}>{p.available ? "available" : "unavailable"}</span>
              </div>
              <div className="provider-detail">{p.detail}</div>
            </div>
          </div>
        ))}
        <details className="setup-collapsible">
          <summary>Setup help — install Claude Code or Codex</summary>
          <div className="setup-help">
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
            <p className="small" style={{ marginBottom: 0 }}>
              After installing, hit <b>Re-check</b> above. Nothing installed? The built-in coach works fully offline — no setup needed.
            </p>
          </div>
        </details>
      </div>

      <h2>Backup</h2>
      <div className="card">
        <p className="small" style={{ marginTop: 0 }}>
          Versioned <span className="kbd">.algomentor</span> archive. Merge keeps both devices' records (deduped by ID);
          replace makes an automatic safety backup first. Mastery is always recomputed from the merged attempt log.
        </p>
        <div className="row">
          <button className="btn" onClick={() => void doExport()}>Export backup</button>
          <button className="btn ghost" onClick={() => void doPreview()}>Import backup…</button>
        </div>
        {preview && importFile && (
          <div style={{ marginTop: 12 }}>
            <div className="small">
              Would add {preview.attempts.add} attempts (skip {preview.attempts.skip} duplicates) ·{" "}
              {preview.designSessions.add} new / {preview.designSessions.update} updated design sessions ·{" "}
              {preview.stories.add} new / {preview.stories.update} updated stories.
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn small" onClick={() => void doImport("merge")}>Merge import</button>
              <button className="btn danger small" onClick={() => { if (confirm("Replace ALL local data? A safety backup is made first.")) void doImport("replace"); }}>
                Replace import
              </button>
            </div>
          </div>
        )}
      </div>

      <h2>Sync (Mac ↔ PC)</h2>
      <div className="card">
        <p className="small" style={{ marginTop: 0 }}>
          Choose a folder synced by OneDrive/Dropbox on both computers. Each device appends to its <i>own</i> event log —
          the live database file is never synced. Targeting {profile.targetCompanies.map((c) => COMPANY_LABELS[c]).join(", ")}.
        </p>
        {sync && (
          <div className="small" style={{ marginBottom: 10 }}>
            <div>Folder: {sync.folder ?? <i>not set</i>}</div>
            <div>Device: <span className="kbd">{sync.deviceId}</span></div>
            <div>Pending events: {sync.pendingEvents} · Last merge: {sync.lastMerge ? sync.lastMerge.slice(0, 16).replace("T", " ") : "never"}</div>
          </div>
        )}
        <div className="row">
          <button className="btn ghost" onClick={() => void chooseSyncFolder()}>Choose sync folder…</button>
          <button className="btn" disabled={!sync?.folder} onClick={() => void doSync()}>Sync now</button>
          {sync?.folder && (
            <button className="btn ghost small" onClick={() => { void api().setSyncFolder(null).then(refresh); }}>Disconnect</button>
          )}
        </div>
      </div>

      <h2>Profile</h2>
      <div className="card">
        <div className="small" style={{ marginBottom: 10 }}>
          {profile.minutesPerDay} min/day · {profile.language} · {profile.experienceYears}y experience
          {profile.interviewDate ? ` · interview ${profile.interviewDate}` : ""}
        </div>
        <button className="btn ghost small" onClick={() => void resetOnboarding()}>Edit profile & regenerate plan</button>
      </div>

      {appInfo && (
        <p className="small">AlgoMentor v{appInfo.version} · data: {appInfo.dataDir}</p>
      )}
    </div>
  );
}
