/**
 * JSON Schemas for Structured Outputs
 * Using OpenAI's Structured Outputs feature (2025)
 */

/**
 * Pattern Recognition Response Schema
 * Ensures GPT-5 returns exactly this structure
 */
export const PatternRecognitionSchema = {
  type: 'object',
  properties: {
    primaryPattern: {
      type: 'string',
      description: 'The main algorithmic pattern that applies',
      enum: [
        'Two Pointers',
        'Sliding Window',
        'Binary Search',
        'Tree BFS',
        'Tree DFS',
        'Fast & Slow Pointers',
        'Merge Intervals',
        'Topological Sort',
        'Cyclic Sort',
        'Dynamic Programming',
        'Backtracking',
        'Union Find',
        'Unknown'
      ]
    },
    secondaryPatterns: {
      type: 'array',
      description: 'Alternative or complementary patterns',
      items: {
        type: 'string'
      }
    },
    confidence: {
      type: 'number',
      description: 'Confidence score from 0.0 to 1.0',
      minimum: 0,
      maximum: 1
    },
    reasoning: {
      type: 'string',
      description: 'Brief explanation of why this pattern applies'
    },
    keyIndicators: {
      type: 'array',
      description: 'Specific problem characteristics that suggest this pattern',
      items: {
        type: 'string'
      }
    }
  },
  required: ['primaryPattern', 'secondaryPatterns', 'confidence', 'reasoning', 'keyIndicators'],
  additionalProperties: false
} as const;

/**
 * Hint Response Schema
 * Ensures hints follow Socratic method structure
 */
export const HintSchema = {
  type: 'object',
  properties: {
    hintType: {
      type: 'string',
      description: 'Type of Socratic question',
      enum: ['clarifying', 'probing', 'implication', 'viewpoint', 'consequence']
    },
    question: {
      type: 'string',
      description: 'The Socratic question to ask'
    },
    guidance: {
      type: 'string',
      description: 'Gentle guidance without giving away solution'
    },
    nextSteps: {
      type: 'array',
      description: 'Suggested next steps for student',
      items: {
        type: 'string'
      },
      maxItems: 3
    }
  },
  required: ['hintType', 'question', 'guidance', 'nextSteps'],
  additionalProperties: false
} as const;
