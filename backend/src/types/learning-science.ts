/**
 * Types for learning science concepts and student modeling
 */

// ==================== Spaced Repetition ====================

export interface SpacedRepetitionState {
  patternId: string;
  nextReviewDate: Date;
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
}

export interface ReviewSchedule {
  id: string;
  userId: string;
  patternId: string;
  nextReviewDate: Date;
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
  lastReviewDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SM2Result {
  nextReviewDate: Date;
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
}

// Quality rating for SM-2 algorithm (0-5)
export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

// ==================== Misconceptions ====================

export interface Misconception {
  id: string;
  userId: string;
  patternId: string;
  description: string;
  firstDetected: Date;
  lastObserved: Date;
  resolved: boolean;
  resolutionDate?: Date;
  occurrenceCount: number;
  correction: string;
}

export interface MisconceptionPattern {
  pattern: RegExp;
  misconception: string;
  correction: string;
}

export interface DetectedMisconception {
  misconception: string;
  correction: string;
  confidence: number;
  detectedIn: string; // What text triggered detection
}

// ==================== Breakthroughs ====================

export interface Breakthrough {
  id: string;
  userId: string;
  patternId: string;
  problemId?: string;
  description: string;
  insight: string;
  masteryBefore: number;
  masteryAfter: number;
  timestamp: Date;
}

// ==================== Subskills ====================

export interface PatternSubskill {
  id: string;
  patternId: string;
  name: string;
  description: string;
  orderIndex: number;
}

export interface SubskillMastery {
  userId: string;
  subskillId: string;
  masteryLevel: number;
  lastPracticed: Date;
  practiceCount: number;
}

// ==================== Learning Sessions ====================

export interface LearningSession {
  id: string;
  userId: string;
  problemId?: string;
  patternId?: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  attemptsCount: number;
  hintsRequested: number;
  completed: boolean;
  success: boolean;
  frustrationScore?: number;
  notes?: string;
}

// ==================== Student Preferences ====================

export interface StudentPreferences {
  userId: string;
  preferredExplanationStyle: 'visual' | 'verbal' | 'code-first' | 'balanced';
  pacePreference: 'fast' | 'moderate' | 'thorough';
  difficultyPreference: 'challenging' | 'comfortable' | 'easy';
  hintAggressiveness: 'minimal' | 'moderate' | 'proactive';
  visualizationPreference: boolean;
  codeLanguagePreferences: string[];
  studyTimePreference?: string; // e.g., "morning", "evening"
  sessionLengthPreference?: number; // minutes
  createdAt: Date;
  updatedAt: Date;
}

// ==================== User Goals ====================

export interface UserGoal {
  userId: string;
  targetRole: string;
  targetCompanies?: string[];
  targetDate?: Date;
  weeklyTimeCommitment: number;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  interviewsScheduled?: InterviewSchedule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewSchedule {
  company: string;
  date: Date;
  round: string;
  type: 'phone-screen' | 'technical' | 'system-design' | 'behavioral';
}

// ==================== Student Model (Comprehensive) ====================

export interface StudentModel {
  userId: string;

  // Cognitive state
  knowledgeState: {
    patterns: Map<string, PatternKnowledge>;
    overallMastery: number;
    strengths: string[]; // Pattern IDs
    weaknesses: string[]; // Pattern IDs
  };

  // Learning characteristics
  learningProfile: {
    preferences: StudentPreferences;
    learningVelocity: number; // Problems solved per week
    confidenceCalibration: number; // -1 (underconfident) to 1 (overconfident)
    frustrationTolerance: number; // 0-1 scale
    averageSessionLength: number; // minutes
    consistencyScore: number; // 0-1, how regularly they practice
  };

  // Long-term memory
  history: {
    misconceptions: Misconception[];
    breakthroughs: Breakthrough[];
    strugglesAndSupports: StruggleSupport[];
    totalSessionCount: number;
    totalPracticeDays: number;
    longestStreak: number;
    currentStreak: number;
  };

  // Goals and motivation
  goals: UserGoal;

  // Computed metrics
  readinessScore: number; // 0-100, readiness for interviews
  recommendedPace: 'intensive' | 'moderate' | 'relaxed';
  nextMilestone: string;
}

export interface PatternKnowledge {
  patternId: string;
  mastery: number;
  subskillMastery: Map<string, number>;
  lastPracticed: Date;
  nextReviewDue: Date;
  practiceCount: number;
  successRate: number;
  averageSolveTime: number;
  commonMistakes: string[];
}

export interface StruggleSupport {
  struggle: string;
  context: string;
  effectiveSupport: string;
  timestamp: Date;
}

// ==================== Recommendations ====================

export interface ProblemRecommendation {
  problemId: string;
  patternId: string;
  reason: string;
  type: 'new' | 'review' | 'challenge';
  priority: number;
  estimatedDifficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedTime: number; // minutes
}

export interface WeeklyPlan {
  userId: string;
  weekStartDate: Date;
  dailyPlans: DailyPlan[];
  focusPatterns: string[]; // Pattern IDs
  reviewPatterns: string[]; // Pattern IDs
  totalEstimatedTime: number; // minutes
  goals: string[];
}

export interface DailyPlan {
  date: Date;
  dayOfWeek: string;
  problems: ProblemRecommendation[];
  patterns: string[]; // Pattern IDs to study
  estimatedTime: number; // minutes
  focusArea: string;
  motivationalMessage: string;
}

// ==================== Progress Narratives ====================

export interface ProgressNarrative {
  userId: string;
  generatedAt: Date;
  timeframe: 'week' | 'month' | 'all-time';

  story: {
    opening: string;
    struggles: string[];
    breakthroughs: string[];
    currentState: string;
    encouragement: string;
  };

  metrics: {
    problemsSolved: number;
    patternsLearned: number;
    currentStreak: number;
    averageSolveTime: number;
    improvementRate: number; // Percentage improvement
    masteryGrowth: number; // Average mastery increase
  };

  visualizations: {
    masteryOverTime: DataPoint[];
    problemsOverTime: DataPoint[];
    patternDistribution: { patternName: string; count: number }[];
  };
}

export interface DataPoint {
  date: string;
  value: number;
}

// ==================== Frustration Detection ====================

export interface FrustrationSignals {
  timeOnProblem: number; // milliseconds
  attemptCount: number;
  repeatedSameQuestion: boolean;
  shortAngryMessages: boolean;
  longSilence: boolean;
  rapidFireQuestions: boolean;
}

export interface FrustrationAssessment {
  score: number; // 0-1
  signals: FrustrationSignals;
  recommendation: 'continue' | 'offer_hint' | 'suggest_break' | 'simplify_problem';
  message?: string;
}

// ==================== Retrieval Practice ====================

export interface RetrievalPrompt {
  type: 'self_explanation' | 'pattern_recall' | 'approach_prediction' | 'complexity_analysis';
  prompt: string;
  expectedElements: string[];
  evaluationCriteria: string[];
}

export interface RetrievalResponse {
  promptType: string;
  studentResponse: string;
  qualityScore: number; // 0-1
  missingElements: string[];
  feedback: string;
}

// ==================== Interview Simulation ====================

export interface MockInterview {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  problemsAttempted: string[]; // Problem IDs
  patternsCovered: string[]; // Pattern IDs

  scores: {
    communication: number; // 0-100
    problemSolving: number; // 0-100
    codeQuality: number; // 0-100
    optimization: number; // 0-100
    testing: number; // 0-100
    overall: number; // 0-100
  };

  feedback: {
    strengths: string[];
    improvements: string[];
    detailedFeedback: string;
    interviewerNotes: string[];
  };

  transcript: InterviewMessage[];
}

export interface InterviewMessage {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
  type: 'question' | 'answer' | 'clarification' | 'hint' | 'code' | 'feedback';
}

// ==================== Adaptive Recommendations ====================

export interface AdaptiveContext {
  currentMastery: number;
  learningVelocity: number;
  recentPerformance: number[];
  timeAvailable: number; // minutes
  dueReviews: string[]; // Pattern IDs
  goals: UserGoal;
  frustrationLevel: number;
}

export interface InterleaveStrategy {
  focusPattern: string;
  reviewPatterns: string[];
  ratio: { focus: number; review: number };
  reasoning: string;
}

// ==================== Database Insert/Update Types ====================

export type InsertReviewSchedule = Omit<ReviewSchedule, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateReviewSchedule = Partial<Omit<ReviewSchedule, 'id' | 'userId' | 'createdAt'>>;

export type InsertMisconception = Omit<Misconception, 'id' | 'occurrenceCount'>;
export type UpdateMisconception = Partial<Omit<Misconception, 'id' | 'userId'>>;

export type InsertBreakthrough = Omit<Breakthrough, 'id'>;

export type InsertLearningSession = Omit<LearningSession, 'id'>;
export type UpdateLearningSession = Partial<Omit<LearningSession, 'id' | 'userId'>>;
