import { useEffect, useState } from "react";
import { api } from "../api";
import type { PatternInfo } from "../../../shared/types";

const BASICS = [
  ["big-o", "Big-O fluency", "Rank O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ); name an example of each."],
  ["arrays-strings", "Array & string mechanics", "Two-pointer in-place reverse; string immutability costs."],
  ["hashmap", "Hash map operations", "Insert/lookup/delete O(1); frequency-count any array."],
  ["linked-list-mech", "Linked list mechanics", "Reverse by hand; insert/delete given only the node."],
  ["stack-queue", "Stack & queue", "Bracket matching; implement one with the other."],
  ["recursion", "Recursion template", "Base + recursive case + combine; trace the call stack."],
  ["tree-traversal", "Tree traversals", "Pre/in/post-order from memory; level order with a queue."],
  ["bst-property", "BST property", "Validate with (low, high) bounds — not just parent checks."],
  ["graph-rep", "Graph representations", "Adjacency list vs matrix; DFS and BFS on a small graph."],
  ["sorting", "Sorting facts", "O(n log n) sorts; when counting/bucket sort applies."],
  ["binary-rep", "Binary & bit basics", "AND/OR/XOR/shifts; n & (n-1) clears the lowest set bit."],
  ["complexity-analysis", "Analyze any loop nest", "State time/space with justification in under a minute."],
] as const;

export default function Patterns({ focus, go }: { focus?: unknown; go: (page: string, arg?: unknown) => void }) {
  const [patterns, setPatterns] = useState<PatternInfo[]>([]);
  const [open, setOpen] = useState<string | null>(typeof focus === "string" ? focus : null);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    api().listPatterns().then(setPatterns).catch(() => {});
  }, []);

  return (
    <div>
      <h1>Patterns</h1>
      <p className="sub">Recognition first: learn <i>when</i> a pattern applies, then drill it. Labels are hidden during mixed review.</p>

      <h2>Basics gate</h2>
      <div className="card">
        <p className="small" style={{ marginTop: 0 }}>Check off each drill you can do cold. These unlock the ladder — be honest.</p>
        {BASICS.map(([id, title, check]) => (
          <div className="check-row" key={id}>
            <input
              type="checkbox"
              checked={checked.has(id)}
              onChange={() => setChecked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; })}
            />
            <div><b>{title}</b> <span className="small">— {check}</span></div>
          </div>
        ))}
        <div className="small" style={{ marginTop: 8 }}>{checked.size}/12 complete</div>
        <div className="bar" style={{ marginTop: 6 }}><div style={{ width: `${(checked.size / 12) * 100}%`, background: "var(--accent2)" }} /></div>
      </div>

      <h2>Pattern ladder</h2>
      {patterns.map((p) => (
        <div className="card" key={p.name}>
          <div className="row" style={{ justifyContent: "space-between", cursor: "pointer" }} onClick={() => setOpen(open === p.name ? null : p.name)}>
            <h3 style={{ margin: 0 }}>{p.order}. {p.name}</h3>
            <span className="small">{open === p.name ? "▾" : "▸"}</span>
          </div>
          {open === p.name && (
            <div style={{ marginTop: 10 }}>
              <p>{p.summary}</p>
              <b>When to use this pattern</b>
              <ul>{p.triggers.map((t, i) => <li key={i}>{t}</li>)}</ul>
              <b>Common pitfalls</b>
              <ul>{p.pitfalls.map((t, i) => <li key={i}>{t}</li>)}</ul>
              <button className="btn small" onClick={() => go("practice", { pattern: p.name })}>Practice {p.name} →</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
