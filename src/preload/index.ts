// AlgoMentor secure preload bridge.
//
// Exposes a typed, promise-based API to the renderer via contextBridge.
// No Node access leaks into the renderer. The API object is a plain
// object of functions (NOT a Proxy): Electron deep-clones whatever is
// passed to exposeInMainWorld, and Proxies cannot be cloned.

import { contextBridge, ipcRenderer } from "electron";
import type { AlgoMentorAPI } from "../shared/types";

// Every method on AlgoMentorAPI. Kept in sync with src/shared/types.ts.
// Each entry becomes (...args) => ipcRenderer.invoke(name, ...args),
// matching the channels registered in src/main/ipc.ts.
const METHODS = [
  "getProfile",
  "saveProfile",
  "getPlan",
  "regeneratePlan",
  "listQuestions",
  "getQuestion",
  "listPatterns",
  "getPattern",
  "recordAttempt",
  "listAttempts",
  "getNextUp",
  "getReviewQueue",
  "getPatternStates",
  "getConfusablePairs",
  "getGameState",
  "recordDrillCompletion",
  "saveMockSession",
  "listMockSessions",
  "listDesignPrompts",
  "saveDesignSession",
  "listDesignSessions",
  "listBehavioralQuestions",
  "saveStory",
  "listStories",
  "deleteStory",
  "rehearseStory",
  "getTutorProviders",
  "getTutorProvider",
  "setTutorProvider",
  "tutorChat",
  "cancelTutor",
  "exportBackup",
  "previewImport",
  "importBackup",
  "generateReport",
  "exportReportMarkdown",
  "getSyncStatus",
  "setSyncFolder",
  "syncNow",
  "pickFile",
  "pickFolder",
  "pickSaveFile",
  "getAppInfo",
] as const;

const api: Record<string, (...args: unknown[]) => Promise<unknown>> = {};
for (const name of METHODS) {
  api[name] = (...args: unknown[]) => ipcRenderer.invoke(name, ...args);
}

contextBridge.exposeInMainWorld("algomentor", api as unknown as AlgoMentorAPI);

declare global {
  interface Window {
    algomentor: AlgoMentorAPI;
  }
}
