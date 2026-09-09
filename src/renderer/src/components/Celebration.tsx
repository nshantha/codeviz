import { useEffect, useState } from "react";
import type { Achievement } from "../../../shared/types";
import "./celebration.css";

export interface CelebrationData {
  xpGained?: number;
  leveledUp?: boolean;
  newLevel?: number;
  newAchievements?: Achievement[];
}

/**
 * Shared celebration UI: XP gain ticker, level-up banner, achievement toasts.
 * Rendered by Practice / Mock / Review after actions that award XP.
 * Auto-dismisses; purely presentational.
 */
export function Celebration({ data, onDone }: { data: CelebrationData | null; onDone: () => void }) {
  const [visible, setVisible] = useState(!!data);

  useEffect(() => {
    setVisible(!!data);
    if (!data) return;
    const t = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 6000);
    return () => clearTimeout(t);
  }, [data, onDone]);

  if (!data || !visible) return null;
  const ach = data.newAchievements ?? [];

  return (
    <div className="celebrate-wrap" onClick={() => { setVisible(false); onDone(); }}>
      <div className="celebrate" onClick={(e) => e.stopPropagation()}>
        {typeof data.xpGained === "number" && data.xpGained > 0 && (
          <div className="xp-tick">+{data.xpGained} XP</div>
        )}
        {data.leveledUp && (
          <div className="levelup">
            <div className="levelup-title">LEVEL UP{data.newLevel ? ` — Level ${data.newLevel}` : ""}</div>
            <div className="small">Your training is compounding.</div>
          </div>
        )}
        {ach.map((a) => (
          <div className="ach-toast" key={a.id}>
            <span className="ach-icon">🏆</span>
            <span>
              <b>{a.name}</b>
              <span className="small" style={{ display: "block" }}>{a.description}</span>
            </span>
          </div>
        ))}
        {(data.xpGained ?? 0) === 0 && !data.leveledUp && ach.length === 0 && (
          <div className="small">Recorded.</div>
        )}
      </div>
    </div>
  );
}
