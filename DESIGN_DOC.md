# AlgoMentor: AI-Powered Interview Mastery System
## Design Document v1.0

**Author**: Nitesh
**Target User**: Myself (Senior SWE Interview Prep → LeetCode Easy → Medium/Hard)
**Competition**: Claude Sonnet 4.5 Competition ("Keep Learning" Award)
**Timeline**: 7 days
**Tech Stack**: Java-focused, React, Sonnet 4.5

---

## Table of Contents
1. [Problem Statement](#problem-statement)
2. [Research Insights](#research-insights)
3. [Core Learning Model](#core-learning-model)
4. [System Architecture](#system-architecture)
5. [Feature Specifications](#feature-specifications)
6. [7-Day Implementation Plan](#7-day-implementation-plan)
7. [Success Metrics](#success-metrics)
8. [Future Expansion](#future-expansion)

---

## Problem Statement

### Current Situation
- **User Profile**: Software engineer preparing for senior FAANG interviews
- **Current Level**: LeetCode Easy comfort zone
- **Target Level**: Confidently solve Medium/Hard, ace system design
- **Language**: Java (primary)
- **Timeline**: Need efficient prep (2-3 months realistic)

### Existing Solutions Fall Short

| Platform | Strengths | Critical Gaps |
|----------|-----------|---------------|
| **LeetCode** | 3000+ problems, real interview questions | ❌ No learning path, no pattern teaching, passive learning |
| **AlgoExpert** | Curated problems, video explanations | ❌ No spaced repetition, no AI adaptation, expensive |
| **Design Gurus** | Pattern-based approach | ❌ Static content, no personalization, no active recall |
| **Anki** | Spaced repetition | ❌ No code execution, no visualization, manual card creation |
| **ChatGPT** | Explains concepts | ❌ No memory of YOUR progress, no systematic practice |

### What I Need

**For Coding Interviews:**
✅ **Pattern-based learning** (not random grinding)
✅ **Spaced repetition** (combat forgetting curve)
✅ **Active recall** (force retrieval, not recognition)
✅ **Deliberate practice** (push comfort zone)
✅ **AI tutor** that knows MY weak patterns
✅ **Visual learning** (algorithm animations)

**For System Design Interviews:**
✅ **System design patterns** (Load Balancing, Caching, Sharding, etc.)
✅ **Interactive canvas** (draw architecture, get AI feedback)
✅ **Scaling questions** (AI challenges: "Now handle 100M users")
✅ **Back-of-envelope calculations** (capacity estimation practice)
✅ **Trade-offs analysis** (SQL vs NoSQL, when to use what)
✅ **Real case studies** (Design Twitter, Uber, etc.)

**Overall:**
✅ **Progress tracking** (coding + system design mastery)

---

## Research Insights

### 1. Pattern-Based Approach (87% Coverage)

**Source**: Analysis of 1000+ FAANG interviews (2024-2025)

**Key Finding**: 87% of FAANG questions use only 10-12 core patterns

**The 12 High-ROI Patterns:**
```
Priority Tier 1 (Master First - Weeks 1-4):
1. Two Pointers ⭐⭐⭐⭐⭐
2. Sliding Window ⭐⭐⭐⭐⭐
3. Binary Search ⭐⭐⭐⭐⭐
4. Tree BFS ⭐⭐⭐⭐
5. Tree DFS ⭐⭐⭐⭐

Priority Tier 2 (Master Next - Weeks 5-8):
6. Fast & Slow Pointers ⭐⭐⭐⭐
7. Merge Intervals ⭐⭐⭐⭐
8. Topological Sort ⭐⭐⭐
9. Cyclic Sort ⭐⭐⭐

Priority Tier 3 (Advanced - Weeks 9-12):
10. Dynamic Programming ⭐⭐⭐⭐⭐
11. Backtracking ⭐⭐⭐⭐
12. Union Find ⭐⭐⭐
```

**Proven Results**:
- Candidates who recognize patterns: **85% success rate**
- Candidates who don't: **35% success rate**
- Learning 10 patterns unlocks ~500+ problems

**Implementation in AlgoMentor**:
- Each pattern gets: Visual explanation + Code template + 5-7 problems (Easy → Hard)
- AI identifies which pattern applies to new problems
- Track mastery per pattern (not just problems solved)

---

### 1B. System Design Patterns (Equally Critical for Senior Roles)

**Source**: Analysis of FAANG system design interviews (2024-2025)

**Key Finding**: For senior+ roles, system design is equally or MORE important than coding. Communication and trade-off analysis matter as much as the design itself.

**The 15 Core System Design Concepts:**
```
Priority Tier 1 (Fundamentals - Weeks 1-2):
1. Load Balancing ⭐⭐⭐⭐⭐
   - Distribute traffic across servers
   - Horizontal vs. vertical scaling
   - Health checks, session persistence

2. Caching ⭐⭐⭐⭐⭐
   - Cache invalidation strategies
   - CDN (Content Delivery Network)
   - Redis/Memcached usage
   - Cache eviction policies (LRU, LFU)

3. Database Design ⭐⭐⭐⭐⭐
   - SQL vs. NoSQL trade-offs
   - Database indexing
   - Normalization vs. denormalization

Priority Tier 2 (Scalability - Weeks 3-4):
4. Database Sharding ⭐⭐⭐⭐
   - Horizontal partitioning
   - Sharding strategies (range, hash, directory)
   - Consistent hashing

5. Database Replication ⭐⭐⭐⭐
   - Master-slave architecture
   - Read replicas
   - Eventual consistency

6. Message Queues ⭐⭐⭐⭐
   - Kafka, RabbitMQ, SQS
   - Asynchronous processing
   - Event-driven architecture

7. API Gateway ⭐⭐⭐⭐
   - Rate limiting
   - Authentication/Authorization
   - Request routing

Priority Tier 3 (Advanced - Weeks 5-8):
8. Microservices Architecture ⭐⭐⭐⭐
9. CAP Theorem ⭐⭐⭐⭐
10. Consistent Hashing ⭐⭐⭐⭐
11. WebSockets / Long Polling ⭐⭐⭐
12. Search Systems (Elasticsearch) ⭐⭐⭐
13. Blob Storage (S3) ⭐⭐⭐
14. MapReduce / Distributed Computing ⭐⭐⭐
15. Monitoring & Logging ⭐⭐⭐
```

**Common System Design Questions:**
```
Beginner Level:
- Design a URL Shortener (TinyURL)
- Design a Parking Lot System
- Design a Rate Limiter

Intermediate Level:
- Design Instagram
- Design Twitter/X Feed
- Design a Chat System (WhatsApp)
- Design Dropbox / Google Drive
- Design a Web Crawler

Advanced Level:
- Design Uber / Ride-Sharing System
- Design YouTube / Netflix
- Design a Distributed Cache
- Design Google Maps
- Design a Payment System
```

**Back-of-Envelope Calculations (Critical Skill):**
```
Key Estimations for Every Design:

1. Traffic Estimation:
   - Daily Active Users (DAU)
   - Requests Per Second (RPS)
   - Peak traffic (usually 2-3x average)

2. Storage Estimation:
   - Data per user/request
   - Growth rate
   - Total storage over time (3-5 years)

3. Bandwidth Estimation:
   - Data in (uploads)
   - Data out (downloads)
   - Network capacity needed

4. Memory/Cache Estimation:
   - Cache size (often 20% of daily traffic)
   - Cache hit ratio impact

Example (Design Twitter):
- 300M DAU
- Each user posts 2 tweets/day → 600M tweets/day
- Each tweet = 280 chars + metadata ≈ 500 bytes
- Storage: 600M * 500 bytes = 300GB/day
- Over 5 years: 300GB * 365 * 5 = ~548TB
```

**Implementation in AlgoMentor**:
- Interactive canvas (drag-drop architecture components)
- AI asks scaling questions: "What if you have 500M users?"
- Back-of-envelope calculator with AI guidance
- Trade-offs analyzer (when to use what)
- Spaced repetition for concepts (like coding patterns)

---

### 2. Spaced Repetition (Combat Forgetting Curve)

**Source**: Ebbinghaus Forgetting Curve + Anki SM-2/FSRS Algorithms

**Key Finding**: Without review, we forget 50% within 1 hour, 70% within 24 hours

**Optimal Review Intervals**:
```
First Review:     1 day after learning
Second Review:    3 days after first review
Third Review:     1 week after second review
Fourth Review:    2 weeks after third review
Fifth Review:     1 month after fourth review
```

**Anki Algorithm (SM-2 Simplified)**:
```java
public class SpacedRepetition {
    // After each review, calculate next interval
    public int calculateNextInterval(int currentInterval, int quality) {
        // quality: 0-5 (0=fail, 5=perfect recall)
        if (quality < 3) {
            return 1; // Reset to 1 day if forgot
        }

        double easeFactor = 2.5; // Adjust based on performance
        int nextInterval = (int) (currentInterval * easeFactor);

        return nextInterval;
    }
}
```

**Implementation in AlgoMentor**:
- Every problem you solve enters the review queue
- AI schedules reviews based on:
  - Your performance (solved independently vs. with hints)
  - Pattern difficulty (DP needs more reviews than Two Pointers)
  - Time since last attempt
- Dashboard shows: "5 problems due for review today"

---

### 3. Active Recall (Retrieval > Recognition)

**Source**: Cognitive psychology research on learning retention

**Key Finding**: Testing yourself (active recall) is 50-100% more effective than re-reading

**The Problem with Passive Learning**:
```
❌ Reading solution → "Oh that makes sense!" → Can't solve similar problem
✅ Struggling to solve → Checking hints → Solving → Can solve similar problems
```

**Recognition vs. Recall**:
- **Recognition**: "I've seen this solution before" (easy but shallow)
- **Recall**: "I need to generate this solution from scratch" (hard but deep)

**Implementation in AlgoMentor**:
```
Wrong Approach (Passive):
1. Show problem
2. Show solution immediately
3. User reads solution
4. User says "I understand" ❌

Right Approach (Active Recall):
1. Show problem
2. User attempts solution (blank editor)
3. If stuck → AI gives minimal hint
4. User tries again
5. Only after 2-3 attempts → show solution
6. Next day: Same problem, blank editor ✅
```

**Forced Retrieval Techniques**:
- **Blank Canvas**: Always start with empty editor (no pre-filled code)
- **Hint System**: Progressive hints (concept → approach → pseudocode → code)
- **Timed Challenges**: Pressure forces retrieval from memory
- **Explain-Back**: AI asks "Explain your approach" before showing solution

---

### 4. Deliberate Practice (Push Comfort Zone)

**Source**: Anders Ericsson's research on expert performance

**Key Finding**: Naive practice (repetition) ≠ Deliberate practice (focused improvement)

**Characteristics of Deliberate Practice**:
```
✅ Specific goals (not "get better at coding")
✅ Focused attention (eliminate distractions)
✅ Immediate feedback (not delayed by days)
✅ Outside comfort zone (70-85% difficulty sweet spot)
✅ Reflection on mistakes (not just moving to next problem)
```

**The 70-85% Difficulty Rule**:
```
Too Easy (<70%):   Boredom, no growth, false confidence
Sweet Spot (70-85%): Flow state, rapid learning, sustainable
Too Hard (>85%):   Frustration, burnout, learned helplessness
```

**Implementation in AlgoMentor**:
```java
public class DifficultyAdapter {
    public Problem getNextProblem(User user, Pattern pattern) {
        double successRate = user.getSuccessRate(pattern);

        if (successRate > 0.85) {
            // Too easy, increase difficulty
            return getProblemOfDifficulty(pattern, "Medium/Hard");
        } else if (successRate < 0.70) {
            // Too hard, decrease difficulty or provide scaffolding
            return getProblemOfDifficulty(pattern, "Easy");
        } else {
            // Sweet spot - maintain current difficulty
            return getProblemOfDifficulty(pattern, "Current");
        }
    }
}
```

**AI-Powered Feedback Loop**:
1. **Immediate**: Code runs → see test results instantly
2. **Formative**: AI reviews approach → "Your logic is correct but inefficient"
3. **Comparative**: AI shows optimal solution → discuss trade-offs
4. **Reflective**: "What would you do differently next time?"

---

### 5. Bloom's 2-Sigma Problem (1-on-1 Tutoring Effect)

**Source**: Benjamin Bloom's 1984 research

**Key Finding**: Students with 1-on-1 tutoring perform 2 standard deviations better (98th percentile vs. 50th percentile)

**Why 1-on-1 Tutoring Works**:
```
1. Personalized pacing (skip what you know, slow down where you struggle)
2. Immediate clarification (ask questions anytime)
3. Adaptive difficulty (tutor adjusts based on your reactions)
4. Mastery learning (don't move on until you've mastered current concept)
5. Socratic method (tutor asks questions, you discover answers)
```

**Can AI Replicate This?**

Traditional AI tutors: **No** (canned responses, no memory, no adaptation)
Sonnet 4.5 with proper system: **Potentially Yes**

**Implementation in AlgoMentor**:
```
Sonnet 4.5 as Your Personal Tutor:

1. Maintains context of YOUR learning journey:
   - Which patterns you've mastered
   - Which mistakes you repeat
   - When you learn best (patterns from session data)

2. Asks Socratic questions (not just gives answers):
   You: "I'm stuck on this Two Pointers problem"
   AI: "What have you tried so far?"
   You: "I used a nested loop"
   AI: "That works. What's the time complexity?"
   You: "O(n²)"
   AI: "Correct. Remember the Two Pointers pattern? How could that help?"

3. Adapts explanation style:
   - Detects when you're confused (multiple failed attempts)
   - Changes explanation approach (visual → analogy → code example)
   - Increases/decreases technical depth based on your responses

4. Mastery-based progression:
   - Won't unlock Dynamic Programming until you master prerequisites
   - Requires 5/7 problems solved in pattern before "mastery"
   - Re-tests periodically to ensure retention
```

---

### 6. Knowledge Tracing (Model YOUR Understanding)

**Source**: Bayesian Knowledge Tracing + Deep Knowledge Tracing research

**Key Finding**: AI can predict with 80-90% accuracy whether you'll solve a problem based on past performance

**Bayesian Knowledge Tracing (BKT)**:
```
Hidden State: Does user KNOW this pattern? (yes/no)

Observable: Did user SOLVE this problem? (yes/no)

Four Key Probabilities:
- P(L0): Initial knowledge (0.1 for new pattern)
- P(T):  Probability of learning (0.3 per problem)
- P(S):  Probability of slip (knows but fails) (0.1)
- P(G):  Probability of guess (doesn't know but succeeds) (0.2)

After each problem:
if (solved correctly):
    P(Learned) = P(Learned_before) + P(T) - P(G)
else:
    P(Learned) = P(Learned_before) - P(S)
```

**Implementation in AlgoMentor**:
```java
public class KnowledgeTracer {
    private Map<Pattern, Double> masteryProbability;

    public void updateKnowledge(Pattern pattern, boolean solved, boolean usedHints) {
        double currentMastery = masteryProbability.get(pattern);

        if (solved && !usedHints) {
            // Strong evidence of mastery
            currentMastery += 0.2;
        } else if (solved && usedHints) {
            // Weak evidence of mastery
            currentMastery += 0.1;
        } else {
            // Evidence of forgetting or never learned
            currentMastery -= 0.15;
        }

        // Cap between 0 and 1
        masteryProbability.put(pattern, Math.max(0, Math.min(1, currentMastery)));
    }

    public boolean isPatternMastered(Pattern pattern) {
        return masteryProbability.get(pattern) > 0.8;
    }
}
```

**What This Enables**:
- **Smart scheduling**: Review patterns you're forgetting, skip patterns you've mastered
- **Prerequisite detection**: "You're struggling with DP because you haven't mastered recursion"
- **Interview readiness**: "You have 75% probability of solving a Medium Two Pointers question"
- **Personalized practice**: Focus time on your weakest patterns

---

## Core Learning Model

### AlgoMentor Learning Loop (Research-Backed)

```
┌─────────────────────────────────────────────────────────────┐
│                    LEARNING CYCLE                           │
└─────────────────────────────────────────────────────────────┘

1. ASSESS (Knowledge Tracing)
   ├─ AI analyzes your current mastery of 12 patterns
   ├─ Identifies weakest pattern
   └─ Selects optimal difficulty problem (70-85% success zone)

2. LEARN (Pattern Introduction)
   ├─ Visual explanation of pattern (animated)
   ├─ Code template with annotations
   ├─ Complexity analysis (time/space)
   └─ When to use this pattern (recognition cues)

3. PRACTICE (Deliberate Practice)
   ├─ Solve problem (blank editor, no pre-filled code)
   ├─ If stuck → Progressive hints (Socratic method)
   ├─ Submit → Immediate feedback
   └─ AI asks follow-up questions (active recall)

4. REFLECT (Metacognition)
   ├─ "Explain your approach in your own words"
   ├─ "What's the time/space complexity? Why?"
   ├─ "How did you know to use this pattern?"
   └─ Compare with optimal solution

5. REVIEW (Spaced Repetition)
   ├─ Problem enters review queue
   ├─ Scheduled based on forgetting curve (1d, 3d, 1w, 2w)
   ├─ Re-attempt problem (blank editor again)
   └─ Update knowledge trace based on performance

6. ADAPT (AI Personalization)
   ├─ Update mastery probability for this pattern
   ├─ Adjust difficulty for next problem
   ├─ Identify patterns that need more practice
   └─ Return to step 1 with new pattern
```

### Mastery Criteria (Per Pattern)

```java
public class PatternMastery {
    // A pattern is "mastered" when:

    boolean isMastered(User user, Pattern pattern) {
        return user.solved(pattern, "Easy") >= 3 &&
               user.solved(pattern, "Medium") >= 2 &&
               user.successRateRecent(pattern, 10) > 0.80 &&
               user.solvedWithoutHints(pattern) >= 3 &&
               user.canExplainPattern(pattern) == true; // AI evaluation
    }
}
```

**Progression Path**:
```
Pattern State Machine:

LOCKED → INTRODUCED → PRACTICING → MASTERED → MAINTAINED

LOCKED:      Prerequisites not met (e.g., can't do DP without recursion)
INTRODUCED:  Watched visual explanation, saw code template
PRACTICING:  Solving problems (3 Easy, 2 Medium attempted)
MASTERED:    Criteria met (80%+ success, explained to AI)
MAINTAINED:  Periodic reviews to prevent forgetting
```

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  • Code Editor (Monaco)                                         │
│  • Algorithm Visualizer (Cytoscape.js / Custom Canvas)         │
│  • Progress Dashboard (Pattern mastery, streak, reviews due)   │
│  • AI Chat Interface (Sonnet 4.5 conversation)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↕ REST API / WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                  │
├─────────────────────────────────────────────────────────────────┤
│  API Layer:                                                     │
│  • Problem CRUD                                                 │
│  • User progress tracking                                       │
│  • Spaced repetition scheduler                                 │
│  • Code execution (Judge0 API or Docker sandbox)               │
│                                                                 │
│  AI Layer (Sonnet 4.5 Integration):                            │
│  • Pattern recognition ("Which pattern applies?")              │
│  • Hint generation (progressive, context-aware)                │
│  • Code review ("Your solution works, but...")                 │
│  • Socratic questioning ("What if input size is 10^9?")        │
│  • Knowledge tracing (Bayesian updating)                       │
│                                                                 │
│  Learning Engine:                                               │
│  • Knowledge Tracer (BKT implementation)                       │
│  • Spaced Repetition Scheduler (SM-2 variant)                 │
│  • Difficulty Adapter (70-85% success zone targeting)         │
│  • Pattern Sequencer (unlock tree)                            │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER (PostgreSQL)                    │
├─────────────────────────────────────────────────────────────────┤
│  Tables:                                                        │
│  • users (profile, settings)                                   │
│  • patterns (12 patterns, metadata)                            │
│  • problems (600+ problems, tagged by pattern + difficulty)   │
│  • submissions (user solutions, timestamp, hints used)         │
│  • knowledge_state (mastery probability per pattern)          │
│  • review_queue (problems due for review, scheduled date)     │
│  • learning_events (log every interaction for analytics)       │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│  • Anthropic API (Claude Sonnet 4.5)                           │
│  • Judge0 API (Code execution sandbox)                         │
│  • Analytics (track learning effectiveness)                    │
└─────────────────────────────────────────────────────────────────┘
```

### Data Models

```typescript
// Core entities

interface User {
  id: string;
  name: string;
  currentLevel: 'Easy' | 'Medium' | 'Hard';
  targetRole: 'SDE2' | 'Senior' | 'Staff';
  interviewDate?: Date;
  settings: {
    dailyGoal: number; // problems per day
    preferredLanguage: 'Java' | 'Python' | 'JavaScript';
    studyTime: number; // minutes per day
  };
}

interface Pattern {
  id: string;
  name: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  prerequisites: string[]; // pattern IDs
  description: string;
  visualExplanation: string; // URL to animation
  codeTemplate: {
    java: string;
    python: string;
    javascript: string;
  };
  timeComplexity: string;
  spaceComplexity: string;
  useCases: string[];
  problemCount: number;
}

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  patterns: string[]; // pattern IDs (some problems use multiple)
  testCases: TestCase[];
  hints: string[]; // progressive hints
  optimalSolution: {
    code: string;
    explanation: string;
    timeComplexity: string;
    spaceComplexity: string;
  };
  companies: string[]; // which companies asked this
  frequency: number; // how often asked (1-10)
}

interface Submission {
  id: string;
  userId: string;
  problemId: string;
  code: string;
  language: string;
  timestamp: Date;
  result: 'Accepted' | 'Wrong Answer' | 'Time Limit' | 'Runtime Error';
  executionTime: number; // ms
  hintsUsed: number;
  attemptNumber: number; // 1st try, 2nd try, etc.
  isReview: boolean; // is this a spaced repetition review?
}

interface KnowledgeState {
  userId: string;
  patternId: string;
  masteryProbability: number; // 0.0 - 1.0 (Bayesian estimate)
  lastPracticed: Date;
  problemsSolved: number;
  problemsAttempted: number;
  averageHintsUsed: number;
  status: 'Locked' | 'Introduced' | 'Practicing' | 'Mastered' | 'Maintained';
  nextReviewDate: Date;
}

interface ReviewQueueItem {
  userId: string;
  problemId: string;
  scheduledDate: Date;
  interval: number; // days since last review
  easeFactor: number; // SM-2 algorithm ease factor
  reviewNumber: number; // 1st review, 2nd review, etc.
}
```

---

## Feature Specifications

### Feature 1: AI-Powered Pattern Learning

**User Story**: As a user at LeetCode Easy level, I want to learn the Two Pointers pattern so I can solve 15+ related problems efficiently.

**Flow**:
```
1. User Dashboard shows: "Recommended: Learn Two Pointers pattern"
2. Click "Start Learning" →
3. Visual Explanation:
   ┌─────────────────────────────────────────┐
   │  Two Pointers Pattern                   │
   ├─────────────────────────────────────────┤
   │  [Animated visualization]               │
   │  Array: [1, 2, 3, 4, 5, 6]             │
   │         ↑              ↑                │
   │       left          right               │
   │                                         │
   │  Concept: Use two pointers moving       │
   │  toward each other or in same direction │
   │                                         │
   │  Time: O(n) - one pass                  │
   │  Space: O(1) - constant space           │
   │                                         │
   │  When to use:                           │
   │  • Sorted array problems                │
   │  • Finding pairs/triplets               │
   │  • Palindrome checks                    │
   │  • Container problems                   │
   └─────────────────────────────────────────┘

4. Code Template:
   ```java
   public int[] twoPointersTemplate(int[] arr) {
       int left = 0;
       int right = arr.length - 1;

       while (left < right) {
           // Process current pair

           // Move pointers based on condition
           if (someCondition) {
               left++;
           } else {
               right--;
           }
       }

       return result;
   }
   ```

5. Interactive Demo:
   User clicks "Step Through Example"
   → Visualization shows pointers moving
   → Sonnet 4.5 narrates: "Notice how we skip the middle
      elements by converging from both ends..."

6. Practice Problems Unlocked:
   ✓ Two Sum II (Easy) - First application
   ✓ Container With Most Water (Medium)
   ✓ 3Sum (Medium)
```

**Sonnet 4.5 Integration**:
```javascript
// Pattern explanation personalization
const patternExplanationPrompt = `
You are teaching the "${patternName}" pattern to a user.

User context:
- Current level: ${userLevel}
- Patterns already mastered: ${masteredPatterns}
- Learning style: ${learningStyle} (visual/verbal/kinesthetic)

Explain this pattern in a way that:
1. Builds on what they already know
2. Uses relatable analogies
3. Matches their technical level
4. Is concise but complete (3-4 paragraphs)

Pattern technical details: ${patternDetails}
`;
```

---

### Feature 2: Socratic AI Interviewer

**User Story**: As a user attempting a problem, I want hints that guide me to the solution (not just give it away), like a real interviewer would.

**Flow**:
```
User is stuck on "Two Sum II" problem after 5 minutes.

User: [Clicks "I'm stuck, give me a hint"]

AI Level 1 (Conceptual Hint):
"This problem involves a sorted array. What patterns work
well with sorted data?"

User: "Maybe binary search?"

AI Level 2 (Narrowing Down):
"Binary search could work, but there's a more efficient
approach. You need to find TWO numbers. Think about how
you could use the sorted property to eliminate possibilities..."

User: "Use two pointers?"

AI Level 3 (Confirm + Nudge):
"Exactly! Two pointers. Where would you place them initially?
At the start and end? Or both at the start?"

User: "Start and end?"

AI Level 4 (Implementation Guidance):
"Correct. Now, if the sum of arr[left] + arr[right] is too
large, which pointer should you move? And why?"

User: [Implements solution]

AI (After Submission - Follow-up Questions):
"Great! Your solution works. Now:
1. What's the time complexity? Why?
2. Could we have used a HashMap instead? Trade-offs?
3. What if the array wasn't sorted?"
```

**Hint Progression Strategy**:
```
Level 1: Pattern Recognition
  "What pattern might apply here?"

Level 2: Approach Direction
  "Think about using X to achieve Y"

Level 3: Algorithm Outline
  "Initialize two pointers at... then in a loop..."

Level 4: Pseudocode
  "
  left = 0
  right = length - 1
  while left < right:
      if sum == target: return
      elif sum < target: move left
      else: move right
  "

Level 5: Partial Code
  [Show method signature and variable setup]

Level 6: Full Solution
  [Only after user has tried 3+ times]
```

**Sonnet 4.5 Prompt Engineering**:
```javascript
const socraticHintPrompt = `
You are a patient coding interviewer helping a candidate.

Problem: ${problemDescription}
User's current code: ${userCode}
User's previous attempts: ${attemptHistory}
Hints already given: ${hintsGiven}

Rules:
1. NEVER give the full solution directly
2. Ask guiding questions (Socratic method)
3. If they're on the wrong track, gently redirect
4. Encourage small wins ("You're thinking in the right direction...")
5. Match their technical vocabulary level
6. Reference patterns they've already learned

Generate the next hint (1-2 sentences) that moves them closer to the solution.
`;
```

---

### Feature 3: Spaced Repetition Review System

**User Story**: As a user who solved a problem 3 days ago, I want to be reminded to review it before I forget, and I want the difficulty to adapt based on my recall.

**Flow**:
```
Day 1: User solves "Two Sum II" successfully
       → Problem scheduled for review in 1 day

Day 2: Dashboard shows "1 problem due for review"
       User clicks "Start Review Session"
       → "Two Sum II" appears (blank editor, no hints visible)

       Scenario A: User solves quickly without hints
       → AI: "Perfect recall! Next review in 1 week"
       → Next review: Day 9

       Scenario B: User needs 1 hint
       → AI: "Good recall with minor help. Next review in 3 days"
       → Next review: Day 5

       Scenario C: User can't remember approach
       → AI: "No problem, let's re-learn this. Next review tomorrow"
       → Next review: Day 3
       → Pattern mastery probability drops 0.85 → 0.70
```

**Review Dashboard**:
```
┌────────────────────────────────────────────┐
│  📚 Review Queue                           │
├────────────────────────────────────────────┤
│  Due Today: 5 problems                     │
│  ├─ Two Sum II (Easy)                      │
│  ├─ 3Sum (Medium)                          │
│  ├─ Container With Most Water (Medium)    │
│  ├─ Longest Substring K Distinct (Medium) │
│  └─ Merge Intervals (Medium)              │
│                                            │
│  Due This Week: 12 problems                │
│  Overdue: 0 problems                       │
│                                            │
│  📊 Review Stats:                          │
│  • Average recall rate: 78%                │
│  • Streak: 12 days                         │
│  • Patterns needing more review:           │
│    - Dynamic Programming (65% recall)      │
│    - Backtracking (58% recall)             │
└────────────────────────────────────────────┘
```

**Scheduling Algorithm**:
```java
public class SpacedRepetitionScheduler {
    public int calculateNextInterval(
        int currentInterval,
        int quality, // 0-5 rating
        double easeFactor
    ) {
        // Based on SM-2 algorithm (used by Anki)

        if (quality < 3) {
            // Failed recall - reset
            return 1; // Review tomorrow
        }

        // Successful recall - increase interval
        if (currentInterval == 0) {
            return 1; // First review: 1 day
        } else if (currentInterval == 1) {
            return 3; // Second review: 3 days
        } else {
            // Subsequent reviews: multiply by ease factor
            easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
            easeFactor = Math.max(1.3, easeFactor); // Minimum ease

            return (int) (currentInterval * easeFactor);
        }
    }

    public int getQualityRating(Submission submission) {
        // Convert submission performance to 0-5 rating
        if (submission.result != "Accepted") return 0;

        int rating = 5;

        // Deduct for hints used
        rating -= submission.hintsUsed;

        // Deduct for multiple attempts
        if (submission.attemptNumber > 1) rating -= 1;

        // Deduct for slow solving time
        if (submission.time > expectedTime * 2) rating -= 1;

        return Math.max(0, Math.min(5, rating));
    }
}
```

---

### Feature 4: Algorithm Visualizer

**User Story**: As a visual learner, I want to see my algorithm execute step-by-step so I can understand what's happening.

**Example: Two Pointers Visualization**

```
Problem: Two Sum II
Input: [2, 7, 11, 15], target = 9

Step-by-step visualization:

Step 1: Initialize pointers
┌───┬───┬────┬────┐
│ 2 │ 7 │ 11 │ 15 │
└───┴───┴────┴────┘
  ↑               ↑
 left          right

sum = 2 + 15 = 17
AI: "Sum is too large, which pointer should we move?"

Step 2: Move right pointer left
┌───┬───┬────┬────┐
│ 2 │ 7 │ 11 │ 15 │
└───┴───┴────┴────┘
  ↑        ↑
 left    right

sum = 2 + 11 = 13
AI: "Still too large, keep moving right pointer"

Step 3: Move right pointer left again
┌───┬───┬────┬────┐
│ 2 │ 7 │ 11 │ 15 │
└───┴───┴────┴────┘
  ↑    ↑
 left right

sum = 2 + 7 = 9 ✓
AI: "Perfect! Found the target sum!"
```

**Supported Visualizations**:

1. **Array-based**:
   - Two Pointers (arrows moving)
   - Sliding Window (window highlight)
   - Binary Search (range narrowing)
   - Sorting algorithms (swap animations)

2. **Tree-based**:
   - BFS (level-by-level expansion)
   - DFS (depth-first traversal path)
   - Binary Search Tree (search path)

3. **Graph-based**:
   - Graph traversal (visited nodes coloring)
   - Shortest path (path highlighting)
   - Cycle detection (cycle highlighting)

4. **Complex Structures**:
   - Stack/Queue operations (push/pop animations)
   - Heap operations (bubble up/down)
   - Dynamic Programming (grid filling)

**Implementation**:
```javascript
// Use Cytoscape.js for graph-like visualizations
// Use custom Canvas/SVG for array visualizations

const visualizer = {
  async animateExecution(code, testCase) {
    // 1. Instrument code to capture state changes
    const instrumented = instrumentCode(code);

    // 2. Execute and collect snapshots
    const snapshots = await executeWithSnapshots(instrumented, testCase);

    // 3. Animate snapshots with Sonnet 4.5 narration
    for (const snapshot of snapshots) {
      renderVisualization(snapshot);
      const narration = await sonnet.narrate(snapshot);
      displayNarration(narration);
      await sleep(1000); // 1 second per step
    }
  }
};
```

---

### Feature 5: Progress Dashboard & Analytics

**User Story**: As a user preparing for interviews, I want to see my progress and know if I'm on track to be interview-ready.

**Dashboard Sections**:

```
┌──────────────────────────────────────────────────────────────┐
│  🎯 Interview Readiness Score: 68/100                        │
│  Target: 85+ for Senior SWE at FAANG                         │
├──────────────────────────────────────────────────────────────┤
│  Pattern Mastery (12 patterns)                               │
│  ██████████░░░░░░░░░░ 5/12 Mastered (42%)                   │
│                                                              │
│  ✅ Mastered (5):                                            │
│    • Two Pointers (95% - 12 problems solved)                │
│    • Sliding Window (88% - 8 problems solved)               │
│    • Binary Search (92% - 10 problems solved)               │
│    • Tree BFS (85% - 7 problems solved)                     │
│    • Fast & Slow Pointers (81% - 6 problems solved)         │
│                                                              │
│  🔄 Practicing (4):                                          │
│    • Tree DFS (65% - 5/7 problems)                          │
│    • Merge Intervals (58% - 3/7 problems)                   │
│    • Topological Sort (45% - 2/7 problems)                  │
│    • Cyclic Sort (38% - 2/7 problems)                       │
│                                                              │
│  🔒 Locked (3):                                              │
│    • Dynamic Programming (requires recursion mastery)       │
│    • Backtracking (requires recursion mastery)              │
│    • Union Find                                             │
├──────────────────────────────────────────────────────────────┤
│  📈 Learning Velocity                                        │
│  • Problems solved this week: 18                             │
│  • Average time per problem: 32 minutes                      │
│  • Success rate (first attempt): 62%                         │
│  • Hints used per problem: 1.4                               │
│                                                              │
│  Projection:                                                 │
│  At current pace → Interview ready in 6 weeks               │
│  To hit target in 4 weeks → solve 25 problems/week          │
├──────────────────────────────────────────────────────────────┤
│  🔥 Streak & Consistency                                     │
│  Current streak: 14 days                                     │
│  Longest streak: 21 days                                     │
│  Study time this week: 8.5 hours                             │
│  Average: 1.2 hours/day                                      │
├──────────────────────────────────────────────────────────────┤
│  📚 Review Queue                                             │
│  Due today: 5 problems                                       │
│  Due this week: 12 problems                                  │
│  Average recall rate: 78%                                    │
│                                                              │
│  [Start Review Session]                                      │
├──────────────────────────────────────────────────────────────┤
│  🎓 Weak Areas (AI-identified)                               │
│  1. Complexity analysis                                      │
│     → You often get time complexity wrong                    │
│     → Recommended: Study Big-O module                        │
│                                                              │
│  2. Edge case handling                                       │
│     → 35% of failures are edge cases (empty, null, etc.)    │
│     → Recommended: Enable "edge case checker"               │
│                                                              │
│  3. Dynamic Programming pattern                              │
│     → Attempted 3 times, failed all                          │
│     → Recommended: Review recursion + memoization first      │
└──────────────────────────────────────────────────────────────┘
```

**AI-Generated Insights**:
```javascript
const weeklyInsightsPrompt = `
Analyze this user's learning data from the past week:

Problems solved: ${problemsSolved}
Patterns practiced: ${patternsPracticed}
Success rates: ${successRates}
Time spent: ${timeSpent}
Review performance: ${reviewPerformance}

Generate 3-5 actionable insights in this format:
1. [Observation] → [Recommendation]

Examples:
- "You're solving problems quickly but making careless mistakes
   → Slow down and test edge cases before submitting"
- "Strong improvement in Two Pointers (45% → 78%)
   → Ready to tackle harder variants like 3Sum"
- "You haven't practiced in 3 days
   → Your review queue is building up. Consider a 30-min session today"
`;
```

---

### Feature 6: Mock Interview Mode

**User Story**: As a user preparing for real interviews, I want to simulate the interview experience (timed, pressure, follow-up questions).

**Mock Interview Flow**:

```
1. User selects: "Start Mock Interview"

2. Configuration:
   - Difficulty: Easy/Medium/Hard/Mixed
   - Duration: 45 minutes (standard interview)
   - Focus patterns: [Auto-select] or [Choose specific]
   - Interview style: FAANG / Startup / Behavioral mix

3. Interview Begins:

   Timer: 45:00
   ┌────────────────────────────────────────┐
   │  Problem 1 of 2                        │
   ├────────────────────────────────────────┤
   │  Two Sum III - Data Structure Design   │
   │                                        │
   │  Design a data structure that accepts  │
   │  a stream of integers and checks if... │
   │                                        │
   │  [Problem description...]              │
   └────────────────────────────────────────┘

   AI Interviewer: "Take a moment to read the problem.
                    Let me know when you're ready to discuss
                    your approach."

4. User thinks out loud (typing in chat):
   User: "I'm thinking of using a HashMap to store..."

   AI: "That's a good start. What operations do you need to support?"

   User: "add() and find()"

   AI: "Right. What's the time complexity of your approach?"

   User: "add() is O(1), find() is O(n)"

   AI: "Correct. Go ahead and implement it."

5. User codes solution

6. AI asks follow-up (like real interview):
   AI: "Good! Now, what if I told you find() will be called
        much more frequently than add()? How would you optimize?"

7. User optimizes

8. Problem 2 begins (if time remaining)

9. Interview ends:

   ┌────────────────────────────────────────┐
   │  Interview Performance Report          │
   ├────────────────────────────────────────┤
   │  Overall: 7.5/10 (Good)                │
   │                                        │
   │  Problem Solving: 8/10                 │
   │  ✓ Identified pattern quickly          │
   │  ✓ Optimized solution                  │
   │  − Missed edge case (empty input)      │
   │                                        │
   │  Communication: 7/10                   │
   │  ✓ Explained approach clearly          │
   │  − Could have discussed trade-offs more│
   │                                        │
   │  Code Quality: 7/10                    │
   │  ✓ Clean, readable code                │
   │  − Variable naming could be better     │
   │                                        │
   │  Time Management: 8/10                 │
   │  ✓ Solved both problems                │
   │  ✓ Left 5 min for testing              │
   │                                        │
   │  Recommendations:                      │
   │  1. Always check for null/empty inputs │
   │  2. Discuss space vs. time trade-offs  │
   │  3. Practice explaining Big-O notation │
   │                                        │
   │  [Save to History] [Share] [Retry]     │
   └────────────────────────────────────────┘
```

**Sonnet 4.5 as Interviewer**:
```javascript
const mockInterviewPrompt = `
You are conducting a FAANG coding interview.

Interview context:
- Duration: ${duration} minutes
- Time remaining: ${timeRemaining}
- Current problem: ${problem}
- Candidate's code so far: ${code}

Your role:
1. Start: Ask candidate to explain their approach
2. During coding: Only intervene if stuck for >3 minutes
3. After solution: Ask optimization/edge case questions
4. End: Provide balanced feedback (positive + constructive)

Style:
- Professional but friendly
- Encourage thinking out loud
- Don't give away answers, ask guiding questions
- Simulate realistic interview pressure (but be supportive)

Current phase: ${phase} (introduction / problem solving / follow-up / wrap-up)

Generate your next response as the interviewer.
`;
```

---

### Feature 7: System Design Canvas & AI Architect

**User Story**: As a senior engineer candidate, I want to practice system design by drawing architectures and getting AI feedback on scalability and trade-offs.

**Interactive Canvas Flow**:

```
1. User selects: "Practice System Design"

2. Choose a problem or create custom:
   - Design Twitter Feed
   - Design Instagram
   - Design Uber
   - Design URL Shortener
   - Custom (user describes system)

3. Canvas Interface:

   ┌─────────────────────────────────────────────────────┐
   │  Design: Twitter Feed System                         │
   ├─────────────────────────────────────────────────────┤
   │  Components Palette:          Canvas:               │
   │  ┌─────────────────┐          ┌──────────────────┐ │
   │  │ Load Balancer   │────►     │                  │ │
   │  │ Web Server      │          │     [Draw Here]  │ │
   │  │ Database (SQL)  │          │                  │ │
   │  │ Database (NoSQL)│          │                  │ │
   │  │ Cache (Redis)   │          │                  │ │
   │  │ CDN             │          │                  │ │
   │  │ Message Queue   │          │                  │ │
   │  │ API Gateway     │          │                  │ │
   │  │ Object Storage  │          │                  │ │
   │  └─────────────────┘          └──────────────────┘ │
   └─────────────────────────────────────────────────────┘

4. User drags components, draws connections

5. AI provides real-time feedback:

   User: [Drags "Database (SQL)" onto canvas]

   AI: "Good start! What data will you store in the SQL database?
        Consider: user profiles, tweets, relationships..."

   User: [Connects "Web Server" directly to "Database"]

   AI: "⚠️ This works for small scale, but what happens when you
        have 10,000 requests/second? Think about adding..."

   User: [Adds "Load Balancer" before Web Servers]

   AI: "✓ Much better! Now you can scale horizontally.
        Next challenge: Where will you cache the feed?"

6. Scaling Questions (Progressive):

   Round 1: Basic Design
   - Draw components for 10K users
   - AI validates: "This handles basic traffic ✓"

   Round 2: Scale to 1M users
   AI: "Now you have 1 million users. Your database is slowing down.
        What would you add?"
   Options: Caching / Read Replicas / Sharding

   Round 3: Scale to 100M users
   AI: "100 million users. Your feed generation is taking 5 seconds.
        How would you optimize?"
   Options: Precompute feeds / Caching layers / CDN

   Round 4: Handle Edge Cases
   AI: "A celebrity with 50M followers posts a tweet.
        What happens to your system? How do you prevent crashes?"
```

**Back-of-Envelope Calculator**:

```
┌────────────────────────────────────────────────────────┐
│  📊 Back-of-Envelope Calculator                        │
├────────────────────────────────────────────────────────┤
│  Problem: Design Twitter                               │
│                                                        │
│  1. Traffic Estimation:                                │
│     Daily Active Users:   [300M      ]                 │
│     Posts per user/day:   [2         ]                 │
│     Reads per user/day:   [50        ]                 │
│                                                        │
│     AI Calculates:                                     │
│     • Write RPS: 6,944 requests/sec                   │
│     • Read RPS: 173,611 requests/sec                  │
│     • Read:Write ratio: 25:1                          │
│                                                        │
│  2. Storage Estimation:                                │
│     Tweet size:           [500 bytes ]                 │
│     Media per tweet:      [1 MB      ]                 │
│     Retention period:     [5 years   ]                 │
│                                                        │
│     AI Calculates:                                     │
│     • Daily storage: 300GB (text) + 600TB (media)     │
│     • 5-year storage: ~1PB                            │
│     • Suggestion: Use S3 for media, compress old data │
│                                                        │
│  3. Bandwidth Estimation:                              │
│     AI Calculates:                                     │
│     • Ingress: 7 GB/sec (peak)                        │
│     • Egress: 175 GB/sec (peak)                       │
│     • CDN can handle 80% of reads → 140 GB/sec        │
│                                                        │
│  4. Cache Sizing:                                      │
│     AI Suggests:                                       │
│     • Cache last 24 hours of popular tweets           │
│     • 20% of tweets generate 80% of reads             │
│     • Cache size: ~60GB                               │
│     • Hit rate: 85%                                   │
└────────────────────────────────────────────────────────┘
```

**Trade-offs Analyzer**:

```
AI asks Socratic questions:

AI: "You've chosen MySQL for storing tweets. Why MySQL over MongoDB?"

User: "Because I need ACID compliance"

AI: "Good point! But consider:
     • Twitter has massive write volume
     • Do you need ACID for every tweet? Or just critical data?
     • What if you used Cassandra for tweets (high write throughput)
       and MySQL only for user accounts?

     Trade-offs to consider:
     ┌─────────────┬──────────────┬──────────────┐
     │             │ MySQL        │ Cassandra    │
     ├─────────────┼──────────────┼──────────────┤
     │ Consistency │ Strong ✓     │ Eventual     │
     │ Write Speed │ Slower       │ Very Fast ✓  │
     │ Complexity  │ Simple ✓     │ Complex      │
     │ Scale       │ Vertical     │ Horizontal ✓ │
     └─────────────┴──────────────┴──────────────┘

     What's more important for tweets: consistency or availability?"
```

**Sonnet 4.5 as System Design Interviewer**:

```javascript
const systemDesignInterviewPrompt = `
You are a senior architect conducting a system design interview.

Problem: ${problemStatement}
User's current design: ${canvasComponents} (components + connections)
User's estimates: ${backOfEnvelopeCalcs}

Interview phase: ${phase}
- requirements_gathering: Ask clarifying questions
- high_level_design: Guide them to draw major components
- deep_dive: Challenge specific components (database choice, caching, etc.)
- scaling: Ask "What if we have 100M users?"
- edge_cases: Test failure scenarios

Your role:
1. Ask clarifying questions (functional/non-functional requirements)
2. Guide, don't solve - let them make design decisions
3. Challenge their choices with Socratic questions
4. Point out bottlenecks: "Your database can't handle this traffic"
5. Discuss trade-offs: "Why X over Y? What do you gain/lose?"
6. Test edge cases: "What if a server crashes?"

Style:
- Professional, collaborative (not adversarial)
- Focus on thought process, not just "correct" answer
- Emphasize trade-offs (there's rarely one right answer)
- Relate to real-world scenarios

Generate your next question or feedback.
`;
```

**System Design Mock Interview Flow**:

```
1. Start Interview (60 minutes)

2. Requirements Gathering (10 min):
   AI: "Let's design Instagram. First, what are the core features?
        Photos only, or videos too? Stories? Direct messaging?"

   User: "Photos, videos, stories, feed, follow users"

   AI: "Good scope. What's your scale?
        - How many users?
        - How many photos uploaded per day?
        - What's your latency requirement for loading feed?"

3. High-Level Design (20 min):
   AI: "Draw the major components at a high level.
        Start with client → servers → database."

   [User draws components]

   AI: "You have mobile clients → API Gateway → Services → Database.
        What services do you need? (Feed, Upload, User, etc.)"

4. Deep Dive (20 min):
   AI: "Let's dive into Feed Service.
        How will you generate a user's feed efficiently?"

   User: "Fan-out on write - precompute feeds"

   AI: "Smart! But what about celebrities with 100M followers?
        Precomputing 100M feeds per post is expensive..."

   [Discussion on hybrid approach]

5. Scaling & Bottlenecks (10 min):
   AI: "You have 500M users now. Where are the bottlenecks?
        - Database?
        - Storage?
        - Bandwidth?"

   [User addresses scaling concerns]

6. Final Report:
   ┌────────────────────────────────────────────┐
   │  System Design Interview Report            │
   ├────────────────────────────────────────────┤
   │  Problem Solving: 8/10                     │
   │  ✓ Identified requirements clearly         │
   │  ✓ Proposed reasonable architecture        │
   │  − Didn't consider data replication initially│
   │                                            │
   │  Scalability Thinking: 7/10                │
   │  ✓ Added caching layers                    │
   │  ✓ Discussed sharding                      │
   │  − Missed CDN for media delivery           │
   │                                            │
   │  Communication: 9/10                       │
   │  ✓ Explained trade-offs clearly            │
   │  ✓ Asked good clarifying questions         │
   │                                            │
   │  Trade-offs Analysis: 7/10                 │
   │  ✓ Discussed SQL vs NoSQL                  │
   │  − Could have explored CAP theorem more    │
   │                                            │
   │  Recommendations:                          │
   │  1. Always consider CDN for static content │
   │  2. Practice back-of-envelope faster       │
   │  3. Study fan-out patterns more deeply     │
   └────────────────────────────────────────────┘
```

---

## 7-Day Implementation Plan

### Day 1: Foundation & Core Infrastructure

**Goal**: Set up project, database, basic UI, Sonnet 4.5 integration

**Tasks**:
```
✅ Project Setup (2 hours)
  - Create React + TypeScript app
  - Set up Node.js backend with Express
  - Configure PostgreSQL database
  - Set up Anthropic SDK

✅ Database Schema (2 hours)
  - Create tables: users, patterns, problems, submissions, knowledge_state, review_queue
  - Seed 12 patterns (name, description, template)
  - Seed 50 problems (focus on Two Pointers, Sliding Window patterns for MVP)

✅ Basic UI (3 hours)
  - Landing page
  - Login/signup (simple, no OAuth for MVP)
  - Dashboard skeleton (empty states)
  - Problem list view

✅ Sonnet 4.5 Integration (3 hours)
  - Test API connection
  - Create reusable AI service layer
  - Test basic prompts (explanation, hints)

Deliverable: Working login → empty dashboard → can see problem list
```

---

### Day 2: Pattern Learning + Code Editor

**Goal**: Implement pattern learning flow and code execution

**Tasks**:
```
✅ Pattern Learning UI (3 hours)
  - Pattern detail page (description, visual, code template)
  - Embed visual explanation (static images for MVP, not animated yet)
  - Display code template with syntax highlighting (Monaco editor)

✅ Code Editor Integration (3 hours)
  - Monaco editor setup (Java, Python, JavaScript support)
  - Basic syntax highlighting
  - Run code button
  - Test case input/output display

✅ Code Execution (4 hours)
  - Integrate Judge0 API (easier than Docker for MVP)
  - Send code + test cases → get results
  - Display results (pass/fail, execution time, error messages)
  - Store submission in database

Deliverable: User can learn a pattern → see code template → write code → run it
```

---

### Day 3: AI Tutor (Hints + Socratic Q&A)

**Goal**: Implement Sonnet 4.5 as interactive tutor

**Tasks**:
```
✅ Hint System (4 hours)
  - "Get Hint" button on problem page
  - Progressive hints (store hint level in state)
  - Sonnet 4.5 generates contextual hints based on:
    * Problem description
    * User's current code
    * Hints already given
    * User's mastered patterns

  Example prompt:
  ```
  Problem: ${problem}
  User's code: ${code}
  Patterns user knows: ${knownPatterns}
  Hints given: ${hintsGiven}

  Generate the next hint (level ${hintLevel}/5):
  1-2: Conceptual direction
  3: Approach outline
  4-5: Pseudocode/partial solution
  ```

✅ AI Chat Interface (4 hours)
  - Chat panel next to code editor
  - User can ask questions: "What pattern should I use?"
  - Sonnet maintains conversation context
  - AI asks follow-up questions after submission:
    "What's the time complexity?"
    "Can you optimize this?"
    "What if input is null?"

✅ Code Review (2 hours)
  - After successful submission, AI reviews code
  - Points out: inefficiencies, missed edge cases, style issues
  - Compares with optimal solution
  - Updates knowledge state based on performance

Deliverable: User gets stuck → asks for hint → AI guides without giving away answer
           User submits code → AI asks follow-up questions
```

---

### Day 4: Knowledge Tracing + Spaced Repetition

**Goal**: Implement learning science algorithms

**Tasks**:
```
✅ Knowledge Tracing System (4 hours)
  - Implement Bayesian Knowledge Tracing (simplified)
  - After each submission, update mastery probability:
    * Solved without hints: +0.2
    * Solved with hints: +0.1
    * Failed: -0.15
  - Track per pattern:
    * Problems solved
    * Success rate
    * Average hints used
  - Pattern state machine: Locked → Introduced → Practicing → Mastered

✅ Spaced Repetition Scheduler (3 hours)
  - Implement SM-2 algorithm (Anki's algorithm)
  - After solving a problem:
    * Add to review_queue
    * Schedule: 1 day, then 3 days, then 1 week, 2 weeks, 1 month
  - Quality rating (0-5) based on:
    * Hints used
    * Time taken
    * Attempt number

✅ Review Session UI (3 hours)
  - Dashboard shows "X problems due for review today"
  - "Start Review Session" button
  - Same problem, blank editor (no hints initially shown)
  - After review: reschedule based on performance

Deliverable: Problems automatically scheduled for review
           User's pattern mastery tracked accurately
```

---

### Day 5: Progress Dashboard + Visualizations

**Goal**: Show user their learning progress (motivation!)

**Tasks**:
```
✅ Progress Dashboard (4 hours)
  - Pattern mastery overview (12 patterns, visual progress bars)
  - Problems solved per pattern
  - Interview readiness score (simple calculation for MVP)
  - Streak tracker (days in a row practicing)
  - Study time this week

✅ Basic Algorithm Visualizer (4 hours)
  - Focus on ONE pattern: Two Pointers
  - Use custom Canvas or Cytoscape.js
  - Show array with pointers moving step-by-step
  - Highlight current elements
  - Display current sum/calculation
  - "Step Forward" / "Play" / "Reset" controls

✅ Analytics & Insights (2 hours)
  - AI-generated weekly insights
  - Identify weak patterns (low success rate)
  - Recommend next steps
  - Learning velocity (problems/week, trending up/down)

Deliverable: User sees clear picture of progress
           Can visualize Two Pointers algorithm execution
```

---

### Day 6: System Design Canvas + Mock Interviews

**Goal**: System design practice + coding interview simulation

**Tasks**:
```
✅ System Design Canvas (4 hours)
  - Drag-drop canvas with React Flow or Cytoscape.js
  - Component palette:
    * Load Balancer, Web Server, Database (SQL/NoSQL)
    * Cache (Redis), CDN, Message Queue, API Gateway
    * Object Storage (S3), Search (Elasticsearch)
  - Draw connections between components
  - Save/export designs as images

✅ AI System Design Feedback (3 hours)
  - Sonnet 4.5 analyzes canvas:
    * Identifies missing components
    * Suggests optimizations
    * Asks scaling questions
    * Evaluates trade-offs

  System prompt:
  ```
  You are a senior architect reviewing a system design.

  Problem: ${problemStatement}
  Components on canvas: ${components}
  Connections: ${connections}
  User's scale requirements: ${scale}

  Analyze the design and provide feedback:
  1. What's missing or could be improved?
  2. Where are potential bottlenecks?
  3. Ask a scaling question (e.g., "What if 100M users?")
  4. Discuss trade-offs of their component choices

  Be Socratic - guide, don't just give answers.
  ```

✅ Back-of-Envelope Calculator (3 hours)
  - Input fields: DAU, requests/user, data size, etc.
  - AI calculates:
    * Traffic (RPS, peak load)
    * Storage (daily, over time)
    * Bandwidth (ingress/egress)
    * Cache sizing
  - Explains calculations step-by-step
  - Suggests optimizations

Deliverable: User can draw system architecture, get AI feedback, do calculations
            (Note: Coding mock interviews moved to future, focus on system design for MVP)
```

---

### Day 7: Polish + Demo Preparation

**Goal**: Fix bugs, improve UX, create demo video

**Tasks**:
```
✅ Bug Fixes & Edge Cases (3 hours)
  - Test all flows end-to-end
  - Fix any crashes or errors
  - Handle edge cases (no internet, API failures)
  - Loading states, error messages

✅ UX Polish (3 hours)
  - Improve visual design (consistent colors, spacing)
  - Add animations/transitions (smooth, not distracting)
  - Onboarding flow (first-time user guidance)
  - Tooltips for unclear features

✅ Demo Video Creation (3 hours)
  - Script: Show problem statement → my journey using this tool
  - Record:
    * Me learning a pattern (Two Pointers)
    * Me solving a problem with AI hints
    * Me reviewing a problem (spaced repetition)
    * Me doing a mock interview
    * Dashboard showing my progress
  - Edit: Add captions, music, 3-4 minutes total

✅ Competition Submission (1 hour)
  - Write post for Discord:
    * Problem I'm solving (FAANG interview prep)
    * How Sonnet 4.5 powers it (pattern recognition, Socratic tutoring, etc.)
    * Screenshots/GIFs
    * Link to demo video
    * Link to live site (deploy on Vercel/Netlify)
  - Deploy app (Vercel for frontend, Railway/Render for backend)

Deliverable: Polished app, demo video, competition post ready
```

---

## Success Metrics

### For Competition Judging

**"Keep Learning" Award Criteria**:
```
✅ Educational Impact:
  - Uses evidence-based learning techniques (spaced repetition, active recall, deliberate practice)
  - Personalized to individual learner (knowledge tracing)
  - Measurable progress (mastery metrics, interview readiness score)

✅ Sonnet 4.5 Showcase:
  - Pattern recognition (identifies which pattern to use)
  - Socratic tutoring (guides without giving answers)
  - Adaptive difficulty (adjusts based on user performance)
  - Conversational interviewer (realistic mock interviews)
  - Code review (explains optimizations)

✅ Innovation:
  - Combines multiple proven techniques (no single tool does this)
  - AI as 1-on-1 tutor (attempts to solve Bloom's 2-sigma problem)
  - Bayesian knowledge tracking (predicts user's understanding)

✅ Demo Appeal:
  - Clear before/after (show my LeetCode Easy → Medium progression)
  - Visual (algorithm animations, progress charts)
  - Relatable (every engineer interviews, everyone struggles with LC)
```

### For Personal Interview Prep

**Week-by-week milestones**:
```
Week 1-2: Master Tier 1 Patterns (Two Pointers, Sliding Window, Binary Search, Tree BFS/DFS)
  ✓ Solve 5-7 problems per pattern
  ✓ 80%+ success rate
  ✓ Can explain pattern to AI without help

Week 3-4: Master Tier 2 Patterns (Fast/Slow Pointers, Merge Intervals, Topological Sort)
  ✓ Solve 5-7 problems per pattern
  ✓ 75%+ success rate on Medium difficulty

Week 5-8: Introduction to Tier 3 (DP, Backtracking, Union Find)
  ✓ Understand concepts
  ✓ Solve 3-5 Easy/Medium problems each
  ✓ 60%+ success rate (these are harder)

Week 9-12: Mock Interviews + Review
  ✓ 2-3 mock interviews per week
  ✓ Maintain spaced repetition reviews
  ✓ 70%+ interview simulation score
```

**Interview Readiness Calculation (Updated for System Design)**:
```java
public int calculateInterviewReadiness(User user) {
    int score = 0;

    // CODING INTERVIEW (50 points total)

    // Coding pattern mastery (30 points)
    int masteredCodingPatterns = user.countMasteredCodingPatterns();
    score += (masteredCodingPatterns / 12.0) * 30;

    // Problem volume (10 points)
    int problemsSolved = user.totalProblemsSolved();
    score += Math.min(10, (problemsSolved / 150.0) * 10);

    // Coding mock interviews (10 points)
    double avgCodingMockScore = user.averageCodingInterviewScore();
    score += avgCodingMockScore; // out of 10

    // SYSTEM DESIGN INTERVIEW (40 points total)

    // System design concept mastery (20 points)
    int masteredSDConcepts = user.countMasteredSystemDesignConcepts();
    score += (masteredSDConcepts / 15.0) * 20;

    // System design problems completed (10 points)
    int sdProblemsCompleted = user.systemDesignProblemsCompleted();
    score += Math.min(10, (sdProblemsCompleted / 10.0) * 10);

    // System design mock interviews (10 points)
    double avgSDMockScore = user.averageSystemDesignInterviewScore();
    score += avgSDMockScore; // out of 10

    // CONSISTENCY (10 points)
    int streak = user.currentStreak();
    score += Math.min(10, streak / 2);

    return score; // 0-100
}

// Breakdown for Senior FAANG roles:
// - Coding: 50 points (pattern mastery 30, volume 10, mocks 10)
// - System Design: 40 points (concepts 20, problems 10, mocks 10)
// - Consistency: 10 points
// Target: 85+ overall, with at least 35/50 coding and 30/40 system design
```

---

## Future Expansion

### Phase 2: Broader Audience (Post-Competition)

**Expand to other users**:

1. **College Students**:
   - Add "Beginner Mode" (start from arrays, loops, basic DS)
   - More gentle progression
   - University course alignment (map to CS 101, Data Structures, Algorithms)

2. **High School / Young Learners**:
   - Visual-first approach (more animations, less theory)
   - Gamification (badges, leaderboards, challenges)
   - Simplified language (avoid jargon)
   - Fun problems (game scenarios instead of business problems)

3. **Multiple Languages**:
   - Beyond Java: Python, JavaScript, C++, Go
   - Language-specific patterns (Python list comprehensions, Java Streams)
   - Translation of problems across languages

4. **Expanded System Design**:
   - More case studies (Design Google Maps, Payment Systems)
   - Industry-specific designs (FinTech, E-commerce, Gaming)
   - Distributed systems deep-dives (Consensus algorithms, Raft, Paxos)

### Phase 3: Social & Community

**Features**:
```
✅ Study Groups:
  - Form groups with friends
  - Shared progress dashboards
  - Competitive leaderboards (friendly competition)

✅ Peer Code Review:
  - Submit solution → get reviewed by AI + peers
  - Review others' code (teaching reinforces learning)

✅ Discussion Forums:
  - Ask questions on specific problems
  - Sonnet 4.5 moderates, provides expert answers

✅ Interview Preparation Buddies:
  - Match with someone at similar level
  - Take turns being interviewer/candidate
  - AI provides feedback on both performances
```

### Phase 4: Advanced AI Features

**Leverage Sonnet 4.5's capabilities**:
```
✅ Multi-modal Learning:
  - Draw out your approach (whiteboard mode)
  - AI analyzes diagram, suggests algorithm

✅ Voice Interviews:
  - Practice explaining verbally (realistic interview)
  - Speech-to-text → AI analyzes communication clarity

✅ Personalized Curriculum:
  - AI generates custom learning path based on:
    * Target company (Google vs. Amazon interview styles differ)
    * Timeline (interview in 2 weeks vs. 3 months)
    * Current skill level
    * Learning speed

✅ Career Guidance:
  - "Based on your skills, you're ready for SDE2 at these companies..."
  - "To reach Staff level, focus on system design and..."
```

---

## Appendix: Research References

### Papers & Studies
1. **Bloom's 2 Sigma Problem** (1984) - Benjamin Bloom
2. **Bayesian Knowledge Tracing** (1995) - Corbett & Anderson
3. **The Forgetting Curve** (1885) - Hermann Ebbinghaus
4. **Deliberate Practice** (1993) - Anders Ericsson
5. **Deep Knowledge Tracing** (2015) - Piech et al., Stanford

### Coding Interview Resources
6. **Design Gurus** - 14 Coding Patterns
7. **Tech Interview Handbook** - Study plans
8. **AlgoExpert** - Problem categorization
9. **LeetCode Discuss** - Real interview experiences
10. **Anki Manual** - SM-2 Algorithm documentation

### System Design Resources
11. **ByteByteGo** - System design interview course (FAANG engineers)
12. **System Design Primer** (GitHub) - donnemartin's comprehensive guide
13. **Grokking System Design Interview** - Design Gurus
14. **IGotAnOffer** - System design interview prep from FAANG experts
15. **Exponent** - System design mock interviews

### AI/ML in Education
16. **AI-enabled Adaptive Learning Systems** (2024) - ScienceDirect review
17. **FSRS Algorithm** (2024) - Next-gen spaced repetition
18. **Khan Academy Research** - Mastery-based learning

---

## Technical Dependencies

### Frontend
```json
{
  "react": "^18.3.1",
  "typescript": "^5.0.0",
  "monaco-editor": "^0.52.0",
  "reactflow": "^11.11.0",
  "cytoscape": "^3.30.0",
  "framer-motion": "^11.0.0",
  "react-router-dom": "^6.0.0",
  "axios": "^1.7.0",
  "recharts": "^2.13.0",
  "tailwindcss": "^3.4.0",
  "canvas-confetti": "^1.9.0"
}
```

**Note on visualization libraries**:
- `reactflow` - For system design canvas (drag-drop architecture diagrams)
- `cytoscape` - For algorithm visualizations (graphs, trees)

### Backend
```json
{
  "express": "^4.21.0",
  "@anthropic-ai/sdk": "^0.30.0",
  "pg": "^8.13.0",
  "jsonwebtoken": "^9.0.0",
  "bcrypt": "^5.1.0",
  "axios": "^1.7.0",
  "node-cron": "^3.0.0"
}
```

### External Services
- **Anthropic API** (Claude Sonnet 4.5)
- **Judge0 API** (Code execution)
- **PostgreSQL** (Database)
- **Vercel** (Frontend hosting)
- **Railway/Render** (Backend hosting)

---

**End of Design Document**

*This document is a living specification. Update as we build and learn.*
