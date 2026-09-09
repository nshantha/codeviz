/**
 * Shared types for AlgoMentor's typed IPC bridge.
 * Imported by main, preload, and renderer. No Node.js APIs here.
 */

export type Difficulty = "Easy" | "Medium" | "Hard";
export type AttemptOutcome = "solved" | "gave_up" | "partial";
export type BankSection = "core" | "gaps" | "breadth";
export type Company = "meta" | "amazon" | "google" | "apple" | "netflix";
export type TutorProviderId = "claude-code" | "codex" | "none";

export const COMPANIES: Company[] = ["meta", "amazon", "google", "apple", "netflix"];
export const COMPANY_LABELS: Record<Company, string> = {
  meta: "Meta",
  amazon: "Amazon",
  google: "Google",
  apple: "Apple",
  netflix: "Netflix",
};

export type MasteryBand = "unstarted" | "learning" | "practicing" | "strong" | "mastered";
export const MASTERY_LABELS: Record<MasteryBand, string> = {
  unstarted: "Not started",
  learning: "Learning",
  practicing: "Practicing",
  strong: "Strong",
  mastered: "Mastered",
};

// ---------------------------------------------------------------- profile

export interface Profile {
  targetCompanies: Company[];
  interviewDate: string | null; // ISO date
  experienceYears: number;
  language: string;
  minutesPerDay: number;
  entryPoint: "basics" | "core" | "company";
  diagnosticScore: number | null; // 0..1, null when skipped
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------- questions

export interface QuestionCompanyTag {
  company: Company;
  section: BankSection;
}

export interface Question {
  leetcodeId: number;
  title: string;
  difficulty: Difficulty;
  pattern: string;
  leetcodeUrl: string;
  neetcode150: boolean;
  companies: QuestionCompanyTag[];
}

export interface PatternInfo {
  name: string;
  order: number;
  /** "When to use this pattern" recognition triggers */
  triggers: string[];
  summary: string;
  pitfalls: string[];
}

// ---------------------------------------------------------------- attempts

export interface AttemptInput {
  questionId: number;
  startedAt: string; // ISO
  endedAt: string; // ISO
  activeMs: number; // excludes paused/backgrounded time
  elapsedMs: number;
  outcome: AttemptOutcome;
  hintsUsed: number; // 0..5 hint levels
  confidence: number; // 1..5 self-rating
  patternIdentifiedUnaided: boolean | null; // null when label was shown
  labelShown: boolean;
  notes: string;
}

export interface Attempt extends AttemptInput {
  id: string; // uuid, stable across devices
  deviceId: string;
  createdAt: string;
}

// ---------------------------------------------------------------- review & mastery

export interface PatternState {
  pattern: string;
  mastery: number; // 0..1 Bayesian knowledge estimate
  ease: number; // SM-2 ease factor
  intervalDays: number;
  nextReview: string | null; // ISO date
  reviewCount: number;
  lapses: number;
  problemsAttempted: number;
  problemsSolved: number;
  updatedAt: string;
}

export interface ReviewItem {
  questionId: number;
  ease: number;
  intervalDays: number;
  nextReview: string; // ISO date
  reviewCount: number;
  lapses: number;
  lastOutcome: AttemptOutcome | null;
  updatedAt: string;
  question?: Question;
  overdueDays?: number;
  urgency?: number;
}

export interface NextUpItem {
  kind: "review" | "new" | "weak-pattern" | "confusable";
  questionId: number | null;
  pattern: string | null;
  reason: string;
  priority: number; // higher = do first
  question?: Question;
}

// ---------------------------------------------------------------- plan

export interface PlanWeek {
  week: number;
  title: string;
  patterns: string[];
  questionIds: number[];
  focus: string;
}

export interface StudyPlan {
  weeks: PlanWeek[];
  totalQuestions: number;
  generatedAt: string;
}

// ---------------------------------------------------------------- system design

export interface DesignSession {
  id: string;
  deviceId: string;
  prompt: string;
  company: Company | null;
  requirements: string;
  estimates: string;
  decisions: string;
  tradeoffs: string;
  feedback: string;
  followups: string;
  selfRating: number | null; // 1..5
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;
}

// ---------------------------------------------------------------- behavioral

export interface Story {
  id: string;
  deviceId: string;
  title: string;
  competencies: string[];
  situation: string;
  task: string;
  action: string;
  result: string;
  rehearsalCount: number;
  lastPracticed: string | null;
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;
}

export interface BehavioralQuestion {
  question: string;
  company: Company;
  tags: string[];
}

// ---------------------------------------------------------------- tutor (M2)

export interface TutorProviderStatus {
  id: TutorProviderId;
  label: string;
  available: boolean;
  detail: string;
}

export interface TutorTurn {
  role: "user" | "tutor";
  text: string;
  at: string;
}

export interface TutorRequest {
  kind: "coding" | "system-design" | "behavioral";
  questionId?: number;
  prompt?: string;
  history: TutorTurn[];
  userMessage: string;
  context: {
    pattern?: string;
    difficulty?: Difficulty;
    elapsedMs?: number;
    hintLevel?: number;
    company?: Company;
  };
}

// ---------------------------------------------------------------- backup (M1) / sync (M3)

export interface BackupManifest {
  format: "algomentor-backup";
  version: 1;
  appVersion: string;
  deviceId: string;
  exportedAt: string;
  counts: Record<string, number>;
}

export interface BackupData {
  manifest: BackupManifest;
  profile: Profile | null;
  attempts: Attempt[];
  patternStates: PatternState[];
  reviewItems: ReviewItem[];
  designSessions: DesignSession[];
  stories: Story[];
}

export interface ImportPreview {
  attempts: { add: number; skip: number };
  designSessions: { add: number; update: number; skip: number };
  stories: { add: number; update: number; skip: number };
  patternStates: { recompute: number };
  reviewItems: { recompute: number };
}

// ---------------------------------------------------------------- report

export interface ReportData {
  generatedAt: string;
  profile: Profile | null;
  totals: { attempts: number; solved: number; solveRate: number; activeMinutes: number; streakDays: number };
  patternMastery: { pattern: string; mastery: number; attempted: number; solved: number; medianActiveMs: number | null }[];
  dueReviews: number;
  overdueReviews: number;
  designSessions: number;
  stories: number;
  next7Days: string[];
  markdown: string;
}

// ---------------------------------------------------------------- IPC API

/** Every method the renderer may call. Implemented in main, exposed via preload. */
export interface AlgoMentorAPI {
  // profile & plan
  getProfile(): Promise<Profile | null>;
  saveProfile(p: Profile): Promise<Profile>;
  getPlan(): Promise<StudyPlan | null>;
  regeneratePlan(): Promise<StudyPlan>;

  // questions & patterns
  listQuestions(filter: { companies?: Company[]; patterns?: string[]; section?: BankSection }): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | null>;
  listPatterns(): Promise<PatternInfo[]>;
  getPattern(name: string): Promise<PatternInfo | null>;

  // practice
  recordAttempt(a: AttemptInput): Promise<{ attempt: Attempt; patternState: PatternState; reviewItem: ReviewItem }>;
  listAttempts(questionId?: number): Promise<Attempt[]>;
  getNextUp(limit?: number): Promise<NextUpItem[]>;

  // review
  getReviewQueue(): Promise<ReviewItem[]>;
  getPatternStates(): Promise<PatternState[]>;
  getConfusablePairs(): Promise<{ a: string; b: string; why: string }[]>;

  // system design
  listDesignPrompts(company?: Company): Promise<{ prompt: string; company: Company | null; grading: string[] }[]>;
  saveDesignSession(s: Partial<DesignSession> & { prompt: string }): Promise<DesignSession>;
  listDesignSessions(): Promise<DesignSession[]>;

  // behavioral
  listBehavioralQuestions(company?: Company): Promise<BehavioralQuestion[]>;
  saveStory(s: Partial<Story> & { title: string }): Promise<Story>;
  listStories(): Promise<Story[]>;
  deleteStory(id: string): Promise<void>;
  rehearseStory(id: string): Promise<Story>;

  // tutor (M2)
  getTutorProviders(): Promise<TutorProviderStatus[]>;
  getTutorProvider(): Promise<TutorProviderId>;
  setTutorProvider(id: TutorProviderId): Promise<void>;
  tutorChat(req: TutorRequest): Promise<{ reply: string; done: boolean }>;
  cancelTutor(): Promise<void>;

  // backup / import / report (M1)
  exportBackup(filePath: string): Promise<{ path: string; counts: Record<string, number> }>;
  previewImport(filePath: string): Promise<ImportPreview>;
  importBackup(filePath: string, mode: "merge" | "replace"): Promise<{ imported: Record<string, number> }>;
  generateReport(): Promise<ReportData>;
  exportReportMarkdown(filePath: string): Promise<{ path: string }>;

  // sync (M3)
  getSyncStatus(): Promise<{ folder: string | null; deviceId: string; pendingEvents: number; lastMerge: string | null }>;
  setSyncFolder(folder: string | null): Promise<void>;
  syncNow(): Promise<{ merged: number; conflicts: number }>;

  // app
  pickFile(filters: { name: string; extensions: string[] }[]): Promise<string | null>;
  pickFolder(): Promise<string | null>;
  pickSaveFile(defaultName: string, filters: { name: string; extensions: string[] }[]): Promise<string | null>;
  getAppInfo(): Promise<{ version: string; dataDir: string; deviceId: string }>;
}

export type IpcMethod = keyof AlgoMentorAPI;
