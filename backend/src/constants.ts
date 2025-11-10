/**
 * Application-wide constants
 */

// Single user constant for MVP (will be replaced with actual auth later)
export const DEFAULT_USER_ID = 'default-user';

// Spaced Repetition Constants (SM-2 Algorithm)
export const SM2_CONSTANTS = {
  INITIAL_INTERVAL: 1, // days
  INITIAL_EASE_FACTOR: 2.5,
  MIN_EASE_FACTOR: 1.3,
  EASE_FACTOR_BONUS: 0.1,
  EASE_FACTOR_PENALTY: 0.2,
  MIN_QUALITY: 0, // 0-5 scale
  MAX_QUALITY: 5,
};

// Learning Science Constants
export const LEARNING_CONSTANTS = {
  // Mastery thresholds
  MASTERY_LOCKED: 0.0,
  MASTERY_INTRODUCED: 0.1,
  MASTERY_PRACTICING: 0.4,
  MASTERY_MASTERED: 0.8,

  // Interleaving ratios
  FOCUS_PATTERN_RATIO: 0.7, // 70% current focus
  REVIEW_PATTERN_RATIO: 0.3, // 30% other patterns

  // Frustration detection
  FRUSTRATION_TIME_THRESHOLD: 30 * 60 * 1000, // 30 minutes
  FRUSTRATION_ATTEMPT_THRESHOLD: 5,

  // Hint progression
  MAX_HINT_LEVEL: 5,

  // Session tracking
  BREAKTHROUGH_IMPROVEMENT_THRESHOLD: 0.3, // 30% mastery jump
  LEARNING_VELOCITY_WINDOW: 7, // days
};

// Misconception patterns by pattern name
export const MISCONCEPTION_PATTERNS = {
  'Two Pointers': [
    {
      pattern: /two.*pointer.*always.*sorted/i,
      misconception: 'Thinks two pointers only work on sorted arrays',
      correction: 'Two pointers work in many contexts: fast/slow for cycle detection, window sliding on unsorted arrays, etc.',
    },
    {
      pattern: /pointer.*same.*direction/i,
      misconception: 'Thinks pointers must move in the same direction',
      correction: 'Pointers can converge (start/end), diverge, or one can be stationary while the other moves.',
    },
  ],
  'Sliding Window': [
    {
      pattern: /fixed.*window.*always/i,
      misconception: 'Thinks sliding window must be fixed size',
      correction: 'Variable-size windows are very common (e.g., smallest subarray with sum >= k, longest substring without repeating characters).',
    },
    {
      pattern: /sliding.*window.*only.*arrays/i,
      misconception: 'Thinks sliding window only applies to arrays',
      correction: 'Sliding window works on strings, linked lists, and any sequential data structure.',
    },
  ],
  'Dynamic Programming': [
    {
      pattern: /recursion.*same.*dp|recursion.*is.*dp/i,
      misconception: 'Confuses recursion with DP',
      correction: 'DP = recursion + memoization (or tabulation). Plain recursion without storing results is not DP.',
    },
    {
      pattern: /always.*2d.*array|must.*be.*table/i,
      misconception: 'Thinks DP always needs 2D table',
      correction: '1D DP is very common (Fibonacci, coin change). Many 2D problems can be space-optimized to 1D.',
    },
    {
      pattern: /bottom.*up.*always.*better/i,
      misconception: 'Thinks bottom-up is always superior to top-down',
      correction: 'Top-down with memoization is often clearer and handles sparse state spaces better. Bottom-up saves stack space.',
    },
  ],
  'Binary Search': [
    {
      pattern: /only.*sorted.*array/i,
      misconception: 'Thinks binary search only works on sorted arrays',
      correction: 'Binary search applies to any monotonic function (finding square root, search in rotated array, etc.).',
    },
    {
      pattern: /mid.*always.*\(left.*\+.*right\).*\/.*2/i,
      misconception: 'Might face integer overflow with (left + right) / 2',
      correction: 'Use left + (right - left) / 2 to avoid overflow, or use language-specific integer division.',
    },
  ],
  'Backtracking': [
    {
      pattern: /backtracking.*same.*recursion/i,
      misconception: 'Confuses backtracking with general recursion',
      correction: 'Backtracking is recursion with choice exploration and explicit undo (state restoration).',
    },
    {
      pattern: /backtracking.*always.*slow/i,
      misconception: 'Thinks backtracking is always inefficient',
      correction: 'With pruning and constraints, backtracking can be very efficient. It\'s optimal for many constraint satisfaction problems.',
    },
  ],
  'Graph Traversal': [
    {
      pattern: /bfs.*always.*better|dfs.*always.*better/i,
      misconception: 'Thinks one traversal is universally better',
      correction: 'BFS finds shortest path in unweighted graphs. DFS uses less memory and is better for path existence, topological sort, etc.',
    },
    {
      pattern: /must.*visit.*all.*nodes/i,
      misconception: 'Thinks graph traversal must visit all nodes',
      correction: 'Many problems need early termination when target is found or condition is met.',
    },
  ],
};

// Hint level configurations
export const HINT_LEVELS = {
  1: { name: 'Clarifying', description: 'Restate problem or constraints' },
  2: { name: 'Approach', description: 'High-level strategy' },
  3: { name: 'Refinement', description: 'Specific technique or pattern' },
  4: { name: 'Detail', description: 'Implementation details or edge cases' },
  5: { name: 'Consequence', description: 'Near-complete solution or pseudocode' },
};

// Problem solving frameworks
export const PROBLEM_SOLVING_FRAMEWORKS = {
  POLYA: {
    name: "Polya's Method",
    steps: [
      {
        phase: 'Understand',
        questions: [
          'What is the input and output?',
          'What are the constraints and edge cases?',
          'Can you restate the problem in your own words?',
          'What examples can you think of?',
        ],
      },
      {
        phase: 'Plan',
        questions: [
          'Have you seen a similar problem before?',
          'What patterns or techniques might apply?',
          'Can you solve a simpler version first?',
          'What data structures would be useful?',
        ],
      },
      {
        phase: 'Execute',
        guidance: [
          'Write pseudocode before coding',
          'Start with a brute force solution',
          'Think out loud as you code',
          'Test with examples as you go',
        ],
      },
      {
        phase: 'Reflect',
        questions: [
          'Why does this solution work?',
          'What is the time and space complexity?',
          'What edge cases might break it?',
          'How could you optimize it further?',
        ],
      },
    ],
  },
  UMPIRE: {
    name: 'UMPIRE Method',
    steps: [
      { phase: 'Understand', description: 'Clarify the problem' },
      { phase: 'Match', description: 'Match to known patterns' },
      { phase: 'Plan', description: 'Outline the approach' },
      { phase: 'Implement', description: 'Write the code' },
      { phase: 'Review', description: 'Test and optimize' },
      { phase: 'Evaluate', description: 'Analyze complexity' },
    ],
  },
};

// Adaptive difficulty settings
export const DIFFICULTY_SETTINGS = {
  EASY_MASTERY_RANGE: [0.0, 0.3],
  MEDIUM_MASTERY_RANGE: [0.3, 0.7],
  HARD_MASTERY_RANGE: [0.7, 1.0],
};

// Interview simulation settings
export const INTERVIEW_SETTINGS = {
  DURATION_MINUTES: 45,
  WARNING_TIME_MINUTES: 5,
  EXPECTED_COMMUNICATION_FREQUENCY: 2 * 60 * 1000, // 2 minutes between communications
  EVALUATION_CRITERIA: [
    'clarifying_questions',
    'thinking_aloud',
    'test_cases',
    'optimization_awareness',
    'code_cleanliness',
    'debugging_skills',
  ],
};
