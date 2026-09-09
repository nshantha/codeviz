import { ipcMain, dialog, BrowserWindow } from "electron";
import type { AlgoMentorAPI, IpcMethod } from "../shared/types";
import { getProfileInternal, saveProfileInternal } from "./profile";
import { generatePlan, getPlanInternal } from "./learning/plan";
import {
  getQuestionInternal,
  listQuestionsInternal,
  recordAttempt,
  listAttemptsInternal,
} from "./learning/engine";
import {
  getReviewQueueInternal,
  getPatternStatesInternal,
  getConfusablePairs,
  getNextUpInternal,
} from "./learning/scheduler";
import { PATTERN_LESSONS } from "./data/patterns";
import { BASICS_DRILLS } from "./data/basics";
import { listDesignPromptsInternal, listDesignSessionsInternal, saveDesignSessionInternal } from "./design";
import {
  listBehavioralQuestionsInternal,
  listStoriesInternal,
  saveStoryInternal,
  deleteStoryInternal,
  rehearseStoryInternal,
} from "./behavioral";
import {
  getTutorProviderStatuses,
  getSelectedProviderId,
  setSelectedProviderId,
  tutorChat,
  cancelTutor,
} from "./tutors";
import {
  writeBackup,
  previewImport,
  importBackup,
} from "./sync/backup";
import { generateReportInternal, exportReportMarkdown } from "./sync/report";
import { getSyncFolder } from "./sync/events";
import { setSyncFolder as setSyncFolderEvent } from "./sync/events";
import { mergeSyncFolder, getSyncStatusInternal } from "./sync/folder-sync";
import { getDeviceId } from "./db";
import { appVersion, dataDir } from "./paths";

type Handler = (e: Electron.IpcMainInvokeEvent, ...args: never[]) => Promise<unknown>;

const handlers: Record<IpcMethod, Handler> = {
  getProfile: async () => getProfileInternal(),
  saveProfile: async (_e, p) => saveProfileInternal(p),
  getPlan: async () => getPlanInternal(),
  regeneratePlan: async () => {
    const profile = getProfileInternal();
    if (!profile) throw new Error("Complete onboarding first.");
    return generatePlan(profile);
  },

  listQuestions: async (_e, filter) => listQuestionsInternal(filter ?? {}),
  getQuestion: async (_e, id) => getQuestionInternal(id),
  listPatterns: async () =>
    PATTERN_LESSONS.map((p) => ({ name: p.name, order: p.order, triggers: p.triggers, summary: p.summary, pitfalls: p.pitfalls })),
  getPattern: async (_e, name) => {
    const p = PATTERN_LESSONS.find((x) => x.name === name);
    return p ? { name: p.name, order: p.order, triggers: p.triggers, summary: p.summary, pitfalls: p.pitfalls } : null;
  },

  recordAttempt: async (_e, a) => recordAttempt(a),
  listAttempts: async (_e, questionId) => listAttemptsInternal(questionId),
  getNextUp: async (_e, limit) => getNextUpInternal(limit ?? 8),

  getReviewQueue: async () => getReviewQueueInternal(),
  getPatternStates: async () => getPatternStatesInternal(),
  getConfusablePairs: async () => getConfusablePairs(),

  listDesignPrompts: async (_e, company) => listDesignPromptsInternal(company),
  saveDesignSession: async (_e, s) => saveDesignSessionInternal(s),
  listDesignSessions: async () => listDesignSessionsInternal(),

  listBehavioralQuestions: async (_e, company) => listBehavioralQuestionsInternal(company),
  saveStory: async (_e, s) => saveStoryInternal(s),
  listStories: async () => listStoriesInternal(),
  deleteStory: async (_e, id) => { deleteStoryInternal(id); },
  rehearseStory: async (_e, id) => rehearseStoryInternal(id),

  getTutorProviders: async () => getTutorProviderStatuses(),
  getTutorProvider: async () => getSelectedProviderId(),
  setTutorProvider: async (_e, id) => { setSelectedProviderId(id); },
  tutorChat: async (_e, req) => tutorChat(req),
  cancelTutor: async () => { cancelTutor(); },

  exportBackup: async (_e, filePath) => writeBackup(filePath),
  previewImport: async (_e, filePath) => previewImport(filePath),
  importBackup: async (_e, filePath, mode) => importBackup(filePath, mode),
  generateReport: async () => generateReportInternal(),
  exportReportMarkdown: async (_e, filePath) => exportReportMarkdown(filePath),

  getSyncStatus: async () => getSyncStatusInternal(),
  setSyncFolder: async (_e, folder) => { setSyncFolderEvent(folder); },
  syncNow: async () => mergeSyncFolder(),

  pickFile: async (e, filters) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const r = await dialog.showOpenDialog(win!, { properties: ["openFile"], filters });
    return r.canceled ? null : r.filePaths[0];
  },
  pickFolder: async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const r = await dialog.showOpenDialog(win!, { properties: ["openDirectory"] });
    return r.canceled ? null : r.filePaths[0];
  },
  pickSaveFile: async (e, defaultName, filters) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const r = await dialog.showSaveDialog(win!, { defaultPath: defaultName, filters });
    return r.canceled || !r.filePath ? null : r.filePath;
  },
  getAppInfo: async () => ({ version: appVersion(), dataDir: dataDir(), deviceId: getDeviceId() }),
};

/** Basics drills are renderer-static content; expose via a non-IPC export for tests. */
export function getBasicsDrills() {
  return BASICS_DRILLS;
}

export function registerIpc(): void {
  for (const [name, handler] of Object.entries(handlers)) {
    ipcMain.handle(name, handler as (...args: unknown[]) => Promise<unknown>);
  }
}
