/**
 * Pattern curriculum: the "when to use this pattern" recognition triggers,
 * summaries, and pitfalls for each pattern in the ladder.
 * Authored from the AlgoMaster 15-pattern research + our FAANG correlation.
 */

export interface PatternLesson {
  name: string;
  order: number;
  triggers: string[];
  summary: string;
  example: { title: string; trace: string };
  pitfalls: string[];
  socraticHints: string[]; // 5 progressive hint levels, pattern-generic
}

const H = (clarify: string, probe: string, imply: string, view: string, consequence: string) => [
  clarify, probe, imply, view, consequence,
];

export const PATTERN_LESSONS: PatternLesson[] = [
  {
    name: "Two Pointers",
    order: 1,
    triggers: [
      "Input is sorted (or can be sorted without losing the answer)",
      "You're asked for pairs/triplets with a target sum or condition",
      "Opposite ends move toward each other, or a fast/slow pair on a linked list",
      "In-place array modification (remove duplicates, move zeroes)",
    ],
    summary:
      "Two pointers trade nested loops for a single pass by exploiting order. On sorted input, moving the pointer at the 'wrong' end is always safe — that's the invariant to prove in the interview.",
    example: {
      title: "Two Sum II — sorted array, find pair summing to target",
      trace:
        "nums = [2,7,11,15], target = 9\n" +
        "l=0 (2), r=3 (15) → 2+15=17 > 9 → r--\n" +
        "l=0 (2), r=2 (11) → 2+11=13 > 9 → r--\n" +
        "l=0 (2), r=1 (7)  → 2+7=9 ✓\n" +
        "Why safe: if nums[l]+nums[r] > target, no pair with r can work (array sorted).",
    },
    pitfalls: [
      "Forgetting to sort first when the problem allows it",
      "Off-by-one on the loop condition (l < r vs l <= r)",
      "3Sum duplicates: skipping equal values after finding a triplet",
    ],
    socraticHints: H(
      "What does the input order tell you? Could sorting help without breaking the answer?",
      "If the array is sorted and the sum is too big, which pointer can you safely move?",
      "What happens to the sum when you move the left pointer right? The right pointer left?",
      "Could you solve it for pairs first, then extend the idea to triplets?",
      "What's the time complexity after sorting? Can you do better than the brute force?",
    ),
  },
  {
    name: "Sliding Window",
    order: 2,
    triggers: [
      "Contiguous subarray/substring with a constraint (at most K distinct, sum ≤ S)",
      "'Longest/shortest subarray/substring such that…'",
      "The window only expands on the right and shrinks on the left — never moves left backward",
    ],
    summary:
      "A window [l, r] maintains an invariant ('the window is valid'). Expand r; when the invariant breaks, shrink l until it holds again. Every element enters and leaves once → O(n).",
    example: {
      title: "Longest substring without repeating characters: 'abcabcbb'",
      trace:
        "l=0, seen={}\n" +
        "r=0 'a' → window 'a' ✓\n" +
        "r=1 'b' → 'ab' ✓   r=2 'c' → 'abc' ✓ (best=3)\n" +
        "r=3 'a' → duplicate! shrink l until 'a' leaves → l=1, window 'bca'\n" +
        "r=4 'b' → shrink → l=2, window 'cab' … best stays 3",
    },
    pitfalls: [
      "Using a sliding window when the window must shrink from both ends (that's not a window)",
      "Forgetting the window is defined by an invariant — state it out loud",
      "Fixed-size vs variable-size: 'at most K' needs a different shrink rule than 'exactly K'",
    ],
    socraticHints: H(
      "What makes a subarray 'valid' here? Can you state the invariant in one sentence?",
      "If you expand the right edge, when exactly does the window become invalid?",
      "When it's invalid, what's the cheapest way to fix it — and why never move l backward?",
      "How would you track the window's contents — what data structure?",
      "Each element enters and leaves once. What does that say about time complexity?",
    ),
  },
  {
    name: "Hash Maps",
    order: 3,
    triggers: [
      "'Find two elements with…' / complements (target − x)",
      "Frequency counting, first unique, anagrams, duplicates",
      "You need O(1) lookup of 'have I seen this before?'",
    ],
    summary:
      "Hash maps buy O(1) membership and frequency queries. The classic move: store what you've seen (value → index/count) so the current element can ask 'is my complement already here?'",
    example: {
      title: "Two Sum: nums=[2,7,11,15], target=9",
      trace:
        "seen={}\n" +
        "x=2: need 7 → not seen → seen={2:0}\n" +
        "x=7: need 2 → seen! → return [0,1]",
    },
    pitfalls: [
      "Using the same element twice (check complement BEFORE inserting)",
      "Defaulting to sorting when a hash map gives O(n)",
      "Forgetting hash maps don't preserve order (use insertion-ordered variants when it matters)",
    ],
    socraticHints: H(
      "For each element, what single question would let you finish immediately?",
      "What would you need to have stored from earlier elements to answer that?",
      "Should you insert the current element before or after checking? Why?",
      "What changes if duplicates are allowed?",
      "O(n) time — what did you trade for it?",
    ),
  },
  {
    name: "Prefix Sum",
    order: 4,
    triggers: [
      "'Subarray sum equals K' / count of subarrays with sum K",
      "Range-sum queries over a static array",
      "Running totals where prefix[j] − prefix[i] = sum(i..j)",
    ],
    summary:
      "Precompute running totals so any subarray sum is O(1): sum(i..j) = prefix[j+1] − prefix[i]. For 'count subarrays summing to K', store prefix frequencies in a hash map — when prefix − K was seen before, every such occurrence closes a valid subarray.",
    example: {
      title: "Subarray Sum Equals K: nums=[1,1,1], k=2",
      trace:
        "freq={0:1} (empty prefix), running=0, count=0\n" +
        "x=1: running=1, need 1-2=-1 → freq has 0 → count=0, freq={0:1,1:1}\n" +
        "x=1: running=2, need 0 → freq[0]=1 → count=1, freq={0:1,1:1,2:1}\n" +
        "x=1: running=3, need 1 → freq[1]=1 → count=2 ✓",
    },
    pitfalls: [
      "Forgetting the empty prefix (freq {0:1}) — subarrays starting at index 0",
      "Prefix sums don't work with a sliding window when negatives are present",
      "Off-by-one: prefix array is length n+1",
    ],
    socraticHints: H(
      "If you knew the sum of everything up to each index, how would you get sum(i..j)?",
      "What running value, stored as you go, lets the current index finish the count?",
      "Why do we seed the map with the empty prefix?",
      "Does a sliding window work here? What breaks it?",
      "O(n) time, O(n) space — can you do better on space?",
    ),
  },
  {
    name: "Binary Search",
    order: 5,
    triggers: [
      "Sorted array, or a monotonic predicate ('can we do it in X?')",
      "'Find minimum maximum' / 'koko eating bananas' — search on the answer",
      "Rotated sorted array — one half is always sorted",
    ],
    summary:
      "Binary search halves a monotonic space. The modern form searches the *answer*: define feasible(x), find the smallest x with feasible(x) true. Rotated arrays work because at least one half is sorted — check which.",
    example: {
      title: "Search in rotated array: [4,5,6,7,0,1,2], target=0",
      trace:
        "lo=0, hi=6, mid=3 (7). Left half [4..7] sorted; target 0 not in [4,7] → lo=4\n" +
        "lo=4, hi=6, mid=5 (1). Left half [0,1] sorted; 0 in [0,1] → hi=4\n" +
        "lo=4, hi=4 → nums[4]=0 ✓",
    },
    pitfalls: [
      "Infinite loop from mid bias — use lo=mid+1 / hi=mid consistently",
      "Searching values when you should search the answer (binary-search-on-answer)",
      "Overflow in (lo+hi)/2 in other languages — use lo+(hi-lo)/2",
    ],
    socraticHints: H(
      "Is there an ordering here — of values, or of 'feasible vs infeasible'?",
      "Can you define a yes/no question where all yeses come after all nos?",
      "In a rotated array, what can you always say about one of the halves?",
      "How do you shrink the range without ever discarding the answer?",
      "Why is this O(log n) and not O(n)?",
    ),
  },
  {
    name: "Stack / Monotonic Stack",
    order: 6,
    triggers: [
      "Parentheses / bracket validity, expression evaluation",
      "'Next greater/smaller element' — one pass with a decreasing/increasing stack",
      "Nested structure that must unwind in reverse order",
    ],
    summary:
      "Stacks unwind nested structure. A *monotonic* stack keeps elements in order so the top is always the nearest greater/smaller — each element is pushed and popped once, giving O(n) 'next greater element' solutions.",
    example: {
      title: "Daily Temperatures: [73,74,75,71,69,72,76,73]",
      trace:
        "stack holds indices with decreasing temps.\n" +
        "i=0 (73): stack=[0]\n" +
        "i=1 (74): pop 0 → ans[0]=1; stack=[1]\n" +
        "i=2 (75): pop 1 → ans[1]=1; stack=[2]\n" +
        "i=5 (72): pops 4(69),3(71) → ans[4]=1,ans[3]=2; stack=[2,5]",
    },
    pitfalls: [
      "Storing values instead of indices (you need the distance)",
      "Wrong monotonic direction — decide increasing vs decreasing from the question",
      "Forgetting leftover stack elements at the end (answer 0)",
    ],
    socraticHints: H(
      "What must be resolved before the current element can be answered?",
      "Which previous elements are still 'waiting' for an answer?",
      "If you keep those waiting elements in order, what does the top give you?",
      "When does an element leave the stack — and what do you learn then?",
      "Each element is pushed and popped once. Complexity?",
    ),
  },
  {
    name: "Linked List",
    order: 7,
    triggers: [
      "In-place reversal / reordering of a list",
      "Fast & slow pointers: cycle detection, middle of list, kth from end",
      "Merging sorted lists — dummy head pattern",
    ],
    summary:
      "Draw the pointers. Reversal is three-pointer surgery (prev/curr/next). Fast & slow pointers separate by speed: cycle detection (Floyd), middle finding, and kth-from-end all fall out of relative motion.",
    example: {
      title: "Reverse linked list: 1→2→3→∅",
      trace:
        "prev=∅, curr=1\n" +
        "next=2; 1.next=∅; prev=1, curr=2\n" +
        "next=3; 2.next=1; prev=2, curr=3\n" +
        "next=∅; 3.next=2; prev=3, curr=∅ → return prev (3→2→1)",
    },
    pitfalls: [
      "Losing the rest of the list — save next BEFORE rewiring",
      "Dummy head forgotten on merge/build problems",
      "Fast/slow off-by-one on even-length lists (define which 'middle' you want)",
    ],
    socraticHints: H(
      "Can you draw the first two steps — which arrows change?",
      "What must you save before you overwrite curr.next?",
      "For cycle detection: if one runner is twice as fast, what happens in a loop?",
      "How would you find the middle without knowing the length?",
      "What's the space complexity — did you allocate anything?",
    ),
  },
  {
    name: "Merge Intervals",
    order: 8,
    triggers: [
      "Intervals overlap / merge / insert / meeting rooms",
      "Sort by start time first — then a single pass merges",
      "Sweep line: count concurrent events with start/end markers",
    ],
    summary:
      "Sort by start; then each interval either overlaps the last merged one (extend its end) or starts a new one. Meeting-rooms-II counts concurrent meetings with a min-heap of end times or sweep-line markers.",
    example: {
      title: "Merge: [[1,3],[2,6],[8,10],[15,18]]",
      trace:
        "sorted by start. merged=[[1,3]]\n" +
        "[2,6]: 2 ≤ 3 → merge → [[1,6]]\n" +
        "[8,10]: 8 > 6 → new → [[1,6],[8,10]]\n" +
        "[15,18]: 15 > 10 → new → [[1,6],[8,10],[15,18]]",
    },
    pitfalls: [
      "Forgetting to sort by start time",
      "Touching intervals ([1,2],[2,3]) — decide if they merge per the problem",
      "Meeting Rooms II: heap of end times vs sweep line — pick one and commit",
    ],
    socraticHints: H(
      "What happens if you sort by start time first?",
      "After sorting, when must two consecutive intervals merge?",
      "How do you know the merged list stays non-overlapping?",
      "For 'minimum rooms': what single number actually matters at any time?",
      "Why is sorting the dominant cost here?",
    ),
  },
  {
    name: "Tree BFS",
    order: 9,
    triggers: [
      "Level order traversal / zigzag / right-side view",
      "Shortest path in an unweighted tree/graph",
      "'Minimum depth', 'level by level' — queue, process level sizes",
    ],
    summary:
      "BFS visits level by level with a queue. Capture the level size before the inner loop to separate levels. In unweighted graphs it's the shortest-path algorithm.",
    example: {
      title: "Level order:     3\n              / \\\n             9  20\n               /  \\\n              15   7",
      trace: "queue=[3] → level size 1 → [3]\nqueue=[9,20] → size 2 → [9,20]\nqueue=[15,7] → size 2 → [15,7]\nresult=[[3],[9,20],[15,7]]",
    },
    pitfalls: [
      "Not snapshotting level size — levels bleed together",
      "Using DFS when the problem asks for shortest/level-based answers",
      "Forgetting the visited set when BFS runs on a graph (not a tree)",
    ],
    socraticHints: H(
      "What order must the nodes come out in?",
      "What data structure gives you 'oldest first'?",
      "How do you know where one level ends and the next begins?",
      "Why is BFS (not DFS) the right tool for shortest path here?",
      "Time and space in terms of tree width?",
    ),
  },
  {
    name: "Tree DFS",
    order: 10,
    triggers: [
      "Path problems (root-to-leaf sums, path existence)",
      "Subtree checks, LCA, diameter, validation (BST)",
      "Serialize/deserialize — recursion mirrors structure",
    ],
    summary:
      "DFS recursion = 'solve for children, combine'. Define the recursive contract precisely ('returns the best downward path'), handle the null base case, and combine. Most tree problems are one contract + one combine step.",
    example: {
      title: "Max depth of binary tree",
      trace:
        "depth(node) = 0 if null else 1 + max(depth(l), depth(r))\n" +
        "    3\n   / \\\n  9  20 → depth(9)=1, depth(20)=2 → depth(3)=3",
    },
    pitfalls: [
      "Vague recursive contract — state exactly what the function returns",
      "Global variables when a return value would do",
      "LCA: returning too early before checking both subtrees",
    ],
    socraticHints: H(
      "If your left and right subtrees already gave you their answers, what would you do?",
      "Can you state the recursive contract in one sentence?",
      "What's the base case — and is it right for empty trees?",
      "Where does the combining happen: on the way down or the way up?",
      "Recursion depth in the worst case?",
    ),
  },
  {
    name: "Graphs",
    order: 11,
    triggers: [
      "Islands / connected components / grid traversal",
      "Course schedule / prerequisites → topological sort (Kahn's or DFS coloring)",
      "Word ladder, clone graph — BFS/DFS over adjacency",
    ],
    summary:
      "Model nodes and edges, then traverse. Grids are implicit graphs (neighbors = 4 directions). Topological sort orders dependencies — Kahn's algorithm (indegree queue) is the most interview-friendly. Always track visited.",
    example: {
      title: "Number of Islands (DFS flood fill)",
      trace:
        "Scan grid; on '1', count++ and DFS-sink the island:\n" +
        "11110 → visit (0,0): sink connected 1s → island #1\n" +
        "11000 … (2,2) unvisited '1' → island #2\n" +
        "00000 → total 2. Each cell visited once → O(m·n).",
    },
    pitfalls: [
      "No visited set on general graphs → infinite loops",
      "Topological sort on a graph with a cycle — detect and report it",
      "Grid bounds checking before access",
    ],
    socraticHints: H(
      "What are the nodes and edges here — even if it's a grid?",
      "How do you avoid revisiting — and what breaks without it?",
      "For prerequisites: what does an edge direction mean?",
      "How would you detect 'impossible' (a cycle)?",
      "BFS vs DFS here — does the problem care about shortest?",
    ),
  },
  {
    name: "Heap / Top-K",
    order: 12,
    triggers: [
      "'K largest/smallest/closest/most frequent'",
      "Running median / data stream — two heaps",
      "Merge K sorted lists — heap of heads",
    ],
    summary:
      "Heaps keep the extreme element at the top in O(log n). For top-K, keep a min-heap of size K (the smallest of the K best is evictable). Running median = max-heap of lower half + min-heap of upper half, rebalanced.",
    example: {
      title: "K closest points to origin, k=1: [[1,3],[-2,2]]",
      trace:
        "max-heap of size 1 by distance².\n" +
        "[1,3]: d²=10 → heap=[[1,3]]\n" +
        "[-2,2]: d²=8 < 10 → pop [1,3], push [-2,2]\n" +
        "result=[[-2,2]]",
    },
    pitfalls: [
      "Min-heap vs max-heap confusion — for top-K largest, keep a MIN-heap of size K",
      "Forgetting to rebalance the two median heaps",
      "Python heapq is min-only — negate for max behavior",
    ],
    socraticHints: H(
      "Do you need all elements sorted, or just the K extreme ones?",
      "What's the smallest heap that could hold your answer?",
      "When a new element arrives, who gets evicted — and why is that safe?",
      "For a running median: what two groups would you maintain?",
      "Heap ops are O(log n) — total complexity?",
    ),
  },
  {
    name: "Tries",
    order: 13,
    triggers: [
      "Prefix search / autocomplete / word dictionary",
      "Word search II on a board — prune with a trie",
      "Many strings, shared prefixes",
    ],
    summary:
      "A trie shares prefixes across words: each node has children and an end-of-word flag. Insert and search are O(L) in word length. For board search, walk the trie alongside DFS and prune dead branches.",
    example: {
      title: "Insert 'apple', search 'app' vs 'apple'",
      trace:
        "root→a→p→p→l→e (e.end=true)\n" +
        "search('app'): walk a,p,p — node exists but end=false → prefix only\n" +
        "search('apple'): walk to e, end=true ✓",
    },
    pitfalls: [
      "Confusing prefix-match with word-match (the end flag)",
      "Rebuilding from scratch when a hash set of prefixes would do (small inputs)",
      "Memory: 26-child arrays vs hash maps per node",
    ],
    socraticHints: H(
      "What do the query strings share with each other?",
      "How would you test 'is there any word starting with…' quickly?",
      "What does each node need to remember?",
      "How do you distinguish a prefix from a complete word?",
      "Cost per operation in terms of word length?",
    ),
  },
  {
    name: "Backtracking",
    order: 14,
    triggers: [
      "'All combinations/permutations/subsets' — enumerate candidates",
      "Choose → explore → unchoose (the undo step is the pattern)",
      "Pruning: abandon a branch as soon as it's invalid",
    ],
    summary:
      "Backtracking is DFS over the decision space: make a choice, recurse, undo the choice. The undo is what makes it backtracking and not just recursion. Prune early — validity checks before recursing cut the tree exponentially.",
    example: {
      title: "Subsets of [1,2,3]",
      trace:
        "dfs(i, path): choose or skip nums[i]\n" +
        "[] → [1] → [1,2] → [1,2,3] ✓ backtrack → [1,3] ✓\n" +
        "→ [1] done → [2] → [2,3] ✓ → [3] ✓ → 8 subsets total",
    },
    pitfalls: [
      "Forgetting to undo the choice (the backtrack step)",
      "Copying the path at the wrong time — snapshot when recording answers",
      "No pruning — exponential blowup on avoidable branches",
    ],
    socraticHints: H(
      "At each step, what are the choices?",
      "After you recurse on a choice, what must you restore?",
      "Can you detect a dead branch before going deeper?",
      "How do you avoid duplicate answers?",
      "How big is the decision tree — worst case?",
    ),
  },
  {
    name: "Dynamic Programming",
    order: 15,
    triggers: [
      "Overlapping subproblems + optimal substructure ('min/max/number of ways')",
      "1-D: climbing stairs, house robber, coin change, LIS",
      "2-D: edit distance, LCS, knapsack, grid paths",
    ],
    summary:
      "DP = recursion + memoization (or bottom-up table). Define dp[i] in words first ('min cost to reach i'), write the recurrence from the last decision, then set base cases. If the recurrence only looks back k steps, compress the table.",
    example: {
      title: "Climbing Stairs: dp[i] = ways to reach step i",
      trace:
        "dp[0]=1, dp[1]=1. dp[i]=dp[i-1]+dp[i-2] (last step was 1 or 2)\n" +
        "i=2: 1+1=2; i=3: 2+1=3; i=4: 3+2=5; i=5: 5+3=8 ✓\n" +
        "Only dp[i-1], dp[i-2] needed → O(1) space.",
    },
    pitfalls: [
      "No plain-English definition of dp[i] before writing code",
      "Wrong iteration order (using updated values in the same pass)",
      "Reaching for 2-D DP at Meta — know it's deprioritized there",
    ],
    socraticHints: H(
      "Can you define the answer for a smaller input in terms of itself?",
      "What was the LAST decision in an optimal solution?",
      "Say dp[i] in words — what exactly does it mean?",
      "What are the base cases?",
      "Do you need the whole table, or just the last row or two?",
    ),
  },
  {
    name: "Greedy",
    order: 16,
    triggers: [
      "Interval scheduling ('maximum meetings', 'minimum arrows')",
      "Locally optimal choice is provably safe (exchange argument)",
      "Jump game, gas station, partition labels",
    ],
    summary:
      "Greedy commits to the locally best choice and never reconsiders. It's only correct with a proof — usually 'sort by end time and take what's compatible'. When you can't prove it, DP is the safer default.",
    example: {
      title: "Minimum arrows to burst balloons [[10,16],[2,8],[1,6],[7,12]]",
      trace:
        "Sort by end: [1,6],[2,8],[7,12],[10,16]\n" +
        "arrow at 6 bursts [1,6],[2,8]; next unburst [7,12] → arrow at 12 bursts [7,12],[10,16]\n" +
        "2 arrows ✓ (earliest end is always safe to shoot)",
    },
    pitfalls: [
      "Assuming greedy works without an exchange argument",
      "Sorting by start when the proof needs sort-by-end",
      "Greedy on knapsack-like problems (that's DP)",
    ],
    socraticHints: H(
      "If you sort the input cleverly, does the first choice become obvious?",
      "Can you argue that some optimal solution uses your first choice?",
      "What would a counterexample look like — try to break it?",
      "When does greedy fail and DP win?",
      "Sort cost dominates — total complexity?",
    ),
  },
  {
    name: "Bit Manipulation",
    order: 17,
    triggers: [
      "Single number / missing number (XOR cancels pairs)",
      "Power of two, counting set bits, bitmask subsets",
      "Note: deprioritized at all five companies — learn cheap tricks only",
    ],
    summary:
      "XOR is its own inverse: a^a=0, a^0=a. That single fact solves 'single number' and 'missing number'. n & (n−1) clears the lowest set bit. Know the tricks; don't over-invest — ask rates are low everywhere.",
    example: {
      title: "Single Number: [4,1,2,1,2]",
      trace: "xor=0 → 0^4=4 → ^1=5 → ^2=7 → ^1=6 → ^2=4 ✓\nPairs cancel; the loner survives.",
    },
    pitfalls: [
      "Over-investing study time here — it's the lowest-yield pattern in the bank",
      "Signed-shift surprises in other languages",
      "Forgetting XOR needs pairs to cancel",
    ],
    socraticHints: H(
      "What happens when you XOR a number with itself?",
      "If pairs cancel, what survives a full pass?",
      "How do you clear the lowest set bit?",
      "Is this really a bit problem, or is there a simpler view?",
      "Given low ask rates, is this where your time should go?",
    ),
  },
  {
    name: "Math & Geometry",
    order: 18,
    triggers: [
      "Rotate image / spiral matrix — layer-by-layer index math",
      "GCD, modular arithmetic, combinatorics",
      "Note: deprioritized at most companies — know the classics",
    ],
    summary:
      "These are formula + careful index problems. Rotate-image works layer by layer with four-way swaps; spiral matrix peels boundaries. Get the index arithmetic right on paper before coding.",
    example: {
      title: "Rotate Image (transpose + reflect)",
      trace:
        "[[1,2,3],[4,5,6],[7,8,9]]\n" +
        "transpose → [[1,4,7],[2,5,8],[3,6,9]]\n" +
        "reverse each row → [[7,4,1],[8,5,2],[9,6,3]] ✓ 90° clockwise",
    },
    pitfalls: [
      "Off-by-one in layer boundaries",
      "Trying to do it in one clever pass instead of two simple passes",
      "Low yield — don't let these eat pattern-study time",
    ],
    socraticHints: H(
      "Can you decompose the transformation into two simpler steps?",
      "What are the layer boundaries — write them down?",
      "Trace a 3×3 by hand before generalizing?",
      "Where's the off-by-one hiding?",
      "Is this worth deep study given ask rates?",
    ),
  },
  {
    name: "Arrays",
    order: 19,
    triggers: [
      "Simulation problems (rotating boxes, diagonal traverse)",
      "In-place transforms that don't fit another pattern",
      "Catch-all for array-native mechanics",
    ],
    summary:
      "The fundamentals bucket: index arithmetic, in-place swaps, boundary handling, and simulation. If no fancier pattern fits, careful array mechanics will.",
    example: {
      title: "Move Zeroes: [0,1,0,3,12]",
      trace:
        "write=0; scan: 1→pos0, 3→pos1, 12→pos2 → [1,3,12,3,12]\n" +
        "fill rest with 0 → [1,3,12,0,0] ✓",
    },
    pitfalls: ["Overwriting values before they're read", "Boundary conditions on the last element"],
    socraticHints: H(
      "What are you tracking as you scan?",
      "Which positions are 'decided' vs 'undecided'?",
      "Can you do it in one pass?",
      "What breaks at the boundaries?",
      "Space complexity — truly in place?",
    ),
  },
];

export const PATTERN_ORDER = PATTERN_LESSONS.map((p) => p.name);

export function getPatternLesson(name: string): PatternLesson | undefined {
  return PATTERN_LESSONS.find((p) => p.name === name);
}
