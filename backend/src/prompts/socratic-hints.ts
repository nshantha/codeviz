/**
 * Socratic Hints System - Progressive Difficulty
 * Based on research on effective Socratic teaching methods
 *
 * Difficulty Levels:
 * 1. Clarifying Questions - Help student understand the problem
 * 2. Probing Questions - Guide toward pattern recognition
 * 3. Implication Questions - Explore consequences of approach
 * 4. Viewpoint Questions - Consider different perspectives
 * 5. Consequence Questions - Understand complexity and edge cases
 */

import { HintSchema } from './schemas';

/**
 * System prompt for Socratic teaching
 * Adapts based on student's current level
 */
export const SOCRATIC_SYSTEM_PROMPT = `You are a patient, encouraging coding interview coach using the Socratic method.

**Your Philosophy:**
- NEVER give direct answers or complete solutions
- Ask guiding questions that lead to discovery
- Celebrate small wins and progress
- Adjust difficulty based on student's understanding
- Build confidence through guided exploration

**Socratic Question Types:**
1. **Clarifying**: Help understand the problem ("What are we trying to find?")
2. **Probing**: Explore assumptions ("Why might that approach work?")
3. **Implication**: Consider consequences ("What would happen if...?")
4. **Viewpoint**: Alternative perspectives ("How else could we look at this?")
5. **Consequence**: Analyze trade-offs ("What's the time complexity?")

**Teaching Principles:**
- Start with easier questions before harder ones
- Build on what the student already knows
- Acknowledge good thinking, even if incomplete
- Redirect gently when off track
- Encourage experimentation

**Tone:**
- Supportive and encouraging
- Patient, never condescending
- Curious and collaborative
- Professional yet friendly

You MUST respond with valid JSON matching the provided schema.`;

/**
 * Hint level configurations
 * Progressive difficulty with specific pedagogical goals
 */
export interface HintLevel {
  level: number;
  name: string;
  goal: string;
  questionType: 'clarifying' | 'probing' | 'implication' | 'viewpoint' | 'consequence';
  guidelines: string[];
  examples: string[];
}

export const HINT_LEVELS: Record<number, HintLevel> = {
  1: {
    level: 1,
    name: 'Problem Understanding',
    goal: 'Ensure student understands the problem and constraints',
    questionType: 'clarifying',
    guidelines: [
      'Ask about problem constraints',
      'Verify understanding of input/output',
      'Explore edge cases together',
      'No pattern hints yet - focus on comprehension'
    ],
    examples: [
      'What information do we have about the input?',
      'What constraints does the problem give us?',
      'Can you describe what the output should look like?',
      'What would be a simple example to start with?'
    ]
  },

  2: {
    level: 2,
    name: 'Pattern Recognition',
    goal: 'Guide student to recognize applicable patterns',
    questionType: 'probing',
    guidelines: [
      'Ask about problem characteristics (sorted, cycles, optimization)',
      'Connect to patterns they might know',
      'Highlight key words in problem statement',
      'Still no direct pattern name - let them discover it'
    ],
    examples: [
      'The array is sorted - what advantage does that give us?',
      'Do you see any characteristics that might suggest an efficient approach?',
      'What patterns have you seen that work well with [key characteristic]?',
      'Think about problems you\'ve solved before - does this remind you of anything?'
    ]
  },

  3: {
    level: 3,
    name: 'Approach Development',
    goal: 'Help student develop a high-level approach',
    questionType: 'implication',
    guidelines: [
      'Guide toward specific approach without spelling it out',
      'Explore implications of different strategies',
      'Ask about time/space complexity goals',
      'Encourage brainstorming multiple approaches'
    ],
    examples: [
      'What would happen if we started from both ends?',
      'How could we avoid checking every possible combination?',
      'If we use this data structure, what operations become easier?',
      'What approach would get us closer to O(n) time?'
    ]
  },

  4: {
    level: 4,
    name: 'Algorithm Design',
    goal: 'Guide through algorithm steps',
    questionType: 'viewpoint',
    guidelines: [
      'Break algorithm into clear steps',
      'Ask about loop invariants and termination',
      'Explore different implementation strategies',
      'Still Socratic - ask don\'t tell'
    ],
    examples: [
      'What should our loop condition be?',
      'How do we know when to move the left pointer vs the right pointer?',
      'What state do we need to track?',
      'What would be a good stopping condition?'
    ]
  },

  5: {
    level: 5,
    name: 'Implementation Details',
    goal: 'Help with specific implementation challenges',
    questionType: 'consequence',
    guidelines: [
      'Address edge cases',
      'Optimize code structure',
      'Consider complexity analysis',
      'Can show pseudocode or partial code at this level'
    ],
    examples: [
      'What happens if the array is empty?',
      'How do we handle duplicates in this approach?',
      'What\'s the time complexity of what we\'ve designed?',
      'Here\'s the basic structure - what goes in each part?'
    ]
  }
};

/**
 * Build Socratic hint prompt based on level
 */
export function buildSocraticHintPrompt(context: {
  problemDescription: string;
  userCode?: string;
  hintLevel: number;
  hintsGiven: string[];
  problemsSolved: number;
  currentMastery: number;
}): string {
  const levelConfig = HINT_LEVELS[context.hintLevel] || HINT_LEVELS[1];

  return `You are helping a student solve this coding problem using the Socratic method.

**Current Hint Level:** ${levelConfig.level}/5 - ${levelConfig.name}
**Goal:** ${levelConfig.goal}
**Question Type:** ${levelConfig.questionType}

**Problem:**
${context.problemDescription}

${context.userCode ? `**Student's Current Code:**
\`\`\`
${context.userCode}
\`\`\`` : '**Student Status:** Has not started coding yet'}

${context.hintsGiven.length > 0 ? `**Previous Hints Given:**
${context.hintsGiven.map((h, i) => `${i + 1}. ${h}`).join('\n')}` : '**First Hint:** This is the student\'s first hint request'}

**Student Context:**
- Problems solved: ${context.problemsSolved}
- Current mastery: ${(context.currentMastery * 100).toFixed(0)}%
- Skill level: ${context.currentMastery > 0.7 ? 'Advanced' : context.currentMastery > 0.4 ? 'Intermediate' : 'Beginner'}

**Guidelines for This Level:**
${levelConfig.guidelines.map(g => `- ${g}`).join('\n')}

**Example Questions for Inspiration:**
${levelConfig.examples.map(e => `- "${e}"`).join('\n')}

**Your Task:**
Generate a Socratic hint following these rules:
1. Use a ${levelConfig.questionType} question to guide discovery
2. Do NOT give the direct answer
3. Build on previous hints
4. Be encouraging and supportive
5. Adjust difficulty to student's level (${context.currentMastery > 0.7 ? 'can be more challenging' : context.currentMastery > 0.4 ? 'moderate challenge' : 'keep it simple'})

Respond with structured JSON including:
- hintType: "${levelConfig.questionType}"
- question: Your Socratic question
- guidance: Brief supporting context (without revealing solution)
- nextSteps: 1-3 concrete actions student can take`;
}

/**
 * Export schema for OpenAI API
 */
export const socraticHintResponseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'socratic_hint',
    strict: true,
    schema: HintSchema
  }
} as const;

/**
 * Adaptive difficulty adjuster
 * Adjusts hint difficulty based on student performance
 */
export function adjustHintDifficulty(context: {
  currentLevel: number;
  studentMastery: number;
  recentAttempts: number;
  successRate: number;
}): number {
  let adjustedLevel = context.currentLevel;

  // If student is struggling (low success rate), ease up
  if (context.successRate < 0.3 && context.recentAttempts >= 2) {
    adjustedLevel = Math.max(1, adjustedLevel - 1);
  }

  // If student is doing well, can be more challenging
  if (context.studentMastery > 0.7 && context.successRate > 0.7) {
    adjustedLevel = Math.min(5, adjustedLevel + 1);
  }

  return adjustedLevel;
}

/**
 * Encouragement messages based on progress
 */
export const ENCOURAGEMENT_MESSAGES = {
  first_hint: [
    "Great question! Let's explore this together.",
    "I love that you're asking for guidance. That's how we learn!",
    "Perfect time to think through this carefully."
  ],
  progress: [
    "You're on the right track!",
    "Good thinking so far!",
    "I see where you're going with this!",
    "That's a solid insight!"
  ],
  struggle: [
    "This is a challenging problem - don't worry, we'll work through it.",
    "It's okay to find this difficult. Let's break it down.",
    "You're making progress, even if it doesn't feel like it yet."
  ],
  near_solution: [
    "You're very close! Just a few more steps.",
    "Almost there! You've got the hard part figured out.",
    "Excellent work so far - you're nearly at the solution!"
  ]
};
