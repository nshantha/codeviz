/**
 * Text analysis utilities for detecting misconceptions and patterns
 */

import { MISCONCEPTION_PATTERNS } from '../constants';
import type { DetectedMisconception, MisconceptionPattern } from '../types/learning-science';

/**
 * Detect misconceptions in student's explanation
 */
export function detectMisconceptions(
  text: string,
  patternName: string
): DetectedMisconception[] {
  const detected: DetectedMisconception[] = [];
  const patterns = MISCONCEPTION_PATTERNS[patternName] || [];

  for (const pattern of patterns) {
    const match = pattern.pattern.exec(text);
    if (match) {
      detected.push({
        misconception: pattern.misconception,
        correction: pattern.correction,
        confidence: 0.8, // Can be enhanced with ML in future
        detectedIn: match[0],
      });
    }
  }

  return detected;
}

/**
 * Detect if student is repeating the same question
 */
export function detectRepeatedQuestion(
  currentMessage: string,
  previousMessages: string[],
  threshold: number = 0.7
): boolean {
  const currentNormalized = normalizeText(currentMessage);

  for (const prevMsg of previousMessages.slice(-5)) {
    // Check last 5 messages
    const prevNormalized = normalizeText(prevMsg);
    const similarity = calculateSimilarity(currentNormalized, prevNormalized);

    if (similarity >= threshold) {
      return true;
    }
  }

  return false;
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate Jaccard similarity between two texts
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.split(' '));
  const words2 = new Set(text2.split(' '));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Detect frustration indicators in text
 */
export function detectFrustrationIndicators(text: string): {
  hasFrustrationIndicators: boolean;
  indicators: string[];
} {
  const frustrationPhrases = [
    /i\s+don'?t\s+understand/i,
    /this\s+is\s+(?:too\s+)?(?:hard|difficult|confusing)/i,
    /i'?m\s+(?:so\s+)?(?:stuck|lost|confused)/i,
    /nothing\s+(?:is\s+)?working/i,
    /i\s+give\s+up/i,
    /this\s+doesn'?t\s+make\s+sense/i,
    /i\s+can'?t\s+(?:do|solve)\s+this/i,
    /what\s+am\s+i\s+doing\s+wrong/i,
  ];

  const indicators: string[] = [];

  for (const pattern of frustrationPhrases) {
    const match = pattern.exec(text);
    if (match) {
      indicators.push(match[0]);
    }
  }

  return {
    hasFrustrationIndicators: indicators.length > 0,
    indicators,
  };
}

/**
 * Detect confidence indicators in text
 */
export function detectConfidenceLevel(text: string): {
  level: 'high' | 'medium' | 'low';
  score: number; // 0-1
} {
  const highConfidence = [
    /i\s+(?:think|believe|know)\s+(?:this|the\s+answer)\s+is/i,
    /i'?m\s+(?:pretty\s+)?sure/i,
    /definitely/i,
    /obviously/i,
    /clearly/i,
  ];

  const lowConfidence = [
    /i'?m\s+not\s+sure/i,
    /maybe/i,
    /(?:i\s+)?guess/i,
    /probably/i,
    /might\s+be/i,
    /could\s+be/i,
    /not\s+(?:really\s+)?certain/i,
    /(?:\?.*){2,}/, // Multiple question marks
  ];

  let score = 0.5; // Neutral

  for (const pattern of highConfidence) {
    if (pattern.test(text)) {
      score += 0.15;
    }
  }

  for (const pattern of lowConfidence) {
    if (pattern.test(text)) {
      score -= 0.15;
    }
  }

  score = Math.max(0, Math.min(1, score));

  let level: 'high' | 'medium' | 'low';
  if (score >= 0.7) level = 'high';
  else if (score <= 0.3) level = 'low';
  else level = 'medium';

  return { level, score };
}

/**
 * Extract problem-solving approach from text
 */
export function extractApproach(text: string): {
  hasApproach: boolean;
  elements: string[];
} {
  const approachIndicators = [
    /(?:use|using|with)\s+(?:a|an)?\s*(hash\s*map|array|stack|queue|heap|tree|graph|two\s+pointer|sliding\s+window|dp|dynamic\s+programming|binary\s+search|dfs|bfs)/gi,
    /(?:first|start|begin)\s+(?:by|with)/i,
    /my\s+(?:approach|strategy|idea|plan)\s+is/i,
    /i\s+(?:would|will|can)\s+(?:use|try|do)/i,
  ];

  const elements: string[] = [];

  for (const pattern of approachIndicators) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      elements.push(match[0]);
    }
  }

  return {
    hasApproach: elements.length > 0,
    elements,
  };
}

/**
 * Assess quality of self-explanation
 */
export function assessSelfExplanation(
  explanation: string,
  expectedElements: string[]
): {
  qualityScore: number; // 0-1
  presentElements: string[];
  missingElements: string[];
} {
  const normalizedExplanation = normalizeText(explanation);
  const presentElements: string[] = [];
  const missingElements: string[] = [];

  for (const element of expectedElements) {
    const normalizedElement = normalizeText(element);
    if (normalizedExplanation.includes(normalizedElement)) {
      presentElements.push(element);
    } else {
      missingElements.push(element);
    }
  }

  const qualityScore = expectedElements.length > 0
    ? presentElements.length / expectedElements.length
    : 0;

  return {
    qualityScore,
    presentElements,
    missingElements,
  };
}

/**
 * Detect code in message
 */
export function detectCode(text: string): {
  hasCode: boolean;
  codeBlocks: string[];
  language?: string;
} {
  // Detect code blocks with backticks
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const inlineCodeRegex = /`([^`]+)`/g;

  const codeBlocks: string[] = [];
  let language: string | undefined;

  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match[1]) language = match[1];
    codeBlocks.push(match[2]);
  }

  while ((match = inlineCodeRegex.exec(text)) !== null) {
    codeBlocks.push(match[1]);
  }

  // Also detect code-like patterns
  const codeLikePatterns = [
    /(?:function|def|class)\s+\w+/,
    /(?:for|while|if)\s*\(/,
    /\w+\s*=\s*\[/,
    /\w+\s*=\s*\{/,
  ];

  for (const pattern of codeLikePatterns) {
    if (pattern.test(text) && codeBlocks.length === 0) {
      codeBlocks.push(text);
      break;
    }
  }

  return {
    hasCode: codeBlocks.length > 0,
    codeBlocks,
    language,
  };
}

/**
 * Calculate message complexity
 */
export function calculateMessageComplexity(text: string): {
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  complexity: 'simple' | 'moderate' | 'complex';
} {
  const words = text.trim().split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  let complexity: 'simple' | 'moderate' | 'complex';
  if (avgWordsPerSentence < 10) complexity = 'simple';
  else if (avgWordsPerSentence < 20) complexity = 'moderate';
  else complexity = 'complex';

  return {
    wordCount,
    sentenceCount,
    avgWordsPerSentence,
    complexity,
  };
}
