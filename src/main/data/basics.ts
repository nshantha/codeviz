/**
 * Basics gate: 12 prerequisite drills before the pattern ladder.
 * Each drill: a concept check the learner must be able to do cold.
 */

export interface BasicsDrill {
  id: string;
  title: string;
  check: string; // what the learner must demonstrate
  content: string; // compact explanation + mini example
}

export const BASICS_DRILLS: BasicsDrill[] = [
  {
    id: "big-o",
    title: "Big-O fluency",
    check: "Rank O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) and name an example of each",
    content:
      "O(1): hash lookup. O(log n): binary search. O(n): single scan. O(n log n): sorting. O(n²): nested loops over pairs. O(2ⁿ): enumerating subsets. Say both time and space — interviewers always ask.",
  },
  {
    id: "arrays-strings",
    title: "Array & string mechanics",
    check: "Two-pointer in-place reverse; know string immutability costs",
    content:
      "Arrays: O(1) index, O(n) insert/delete mid. In-place reverse: swap ends moving inward. Strings are immutable in most languages — building char-by-char with += is O(n²); use a list/array builder.",
  },
  {
    id: "hashmap",
    title: "Hash map operations",
    check: "Insert/lookup/delete in O(1) average; frequency-count any array",
    content:
      "The workhorse. Average O(1) get/put; worst O(n) on pathological hashing. Default-dict / get-with-default avoids key-existence bugs. Frequency map is the first tool for 'duplicates/anagrams/complements'.",
  },
  {
    id: "linked-list-mech",
    title: "Linked list mechanics",
    check: "Reverse a list by hand; insert/delete given only the node",
    content:
      "No indexing — only next pointers. Reversal rewires curr.next to prev while saving next first. Dummy heads eliminate empty-list edge cases. Draw every step; never trust mental pointer juggling.",
  },
  {
    id: "stack-queue",
    title: "Stack & queue",
    check: "Implement a stack with two queues (or vice versa); match brackets",
    content:
      "Stack = LIFO (undo, nesting, DFS). Queue = FIFO (levels, BFS). Bracket matching: push opens, pop on close and check the pair. Deque gives both ends in O(1).",
  },
  {
    id: "recursion",
    title: "Recursion template",
    check: "Write factorial/fibonacci recursively and identify base + recursive case",
    content:
      "Every recursion: base case (stop) + recursive case (smaller problem) + combine. Trace the call stack on paper for n=4 once — that mental model carries every tree/graph problem.",
  },
  {
    id: "tree-traversal",
    title: "Tree traversals",
    check: "Pre/in/post-order of a 5-node tree from memory; level order with a queue",
    content:
      "Pre: node,left,right (copy). In: left,node,right (BST → sorted). Post: left,right,node (delete/bottom-up). Level: queue. Inorder of a BST is sorted — that's asked constantly.",
  },
  {
    id: "bst-property",
    title: "BST property",
    check: "Validate a BST (bounds, not just parent comparison)",
    content:
      "Left subtree < node < right subtree — for ALL descendants, not just children. Validate with (low, high) bounds passed down. Classic trap: checking only parent-child pairs.",
  },
  {
    id: "graph-rep",
    title: "Graph representations",
    check: "Adjacency list vs matrix; DFS and BFS on a 4-node graph",
    content:
      "Adjacency list: O(V+E) space, iterate neighbors fast. Matrix: O(V²), O(1) edge check. DFS with a stack/recursion, BFS with a queue. Visited set is mandatory on general graphs.",
  },
  {
    id: "sorting",
    title: "Sorting facts",
    check: "Know O(n log n) sorts; when counting sort / bucket sort applies",
    content:
      "Comparison sorts: O(n log n). Counting/bucket: O(n+k) when the value range is small. Sort first is a legitimate strategy — many two-pointer/interval/greedy solutions start there.",
  },
  {
    id: "binary-rep",
    title: "Binary & bit basics",
    check: "AND/OR/XOR/shifts; n & (n-1) clears the lowest set bit",
    content:
      "XOR: a^a=0, a^0=a (pairs cancel). n&(n−1) drops the lowest 1-bit. <<1 doubles, >>1 halves. Enough for the cheap bit tricks; the pattern itself is low-yield.",
  },
  {
    id: "complexity-analysis",
    title: "Analyze any loop nest",
    check: "Given code, state time/space with justification in under a minute",
    content:
      "Count the dominant operation. Drop constants and lower terms. Nested loops multiply; sequential add. Recursion: depth × work per level. Amortized: hash resizes, dynamic arrays. Say it out loud — that's the interview skill.",
  },
];
