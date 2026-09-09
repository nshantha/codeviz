/** Client-side mirror of the main-process masteryBand (kept in sync manually). */
export function masteryBand(m: number, attempted: number): "unstarted" | "learning" | "practicing" | "strong" | "mastered" {
  if (attempted === 0) return "unstarted";
  if (m < 0.3) return "learning";
  if (m < 0.55) return "practicing";
  if (m < 0.8) return "strong";
  return "mastered";
}
