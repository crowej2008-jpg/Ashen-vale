import React from "react";
import { useGame } from "../context/GameContext.jsx";
import { computeCP, buildUnit } from "@ashenvale/shared";

export default function CollectionScreen({ onBack }) {
  const { ownedList, levelUpHero, gold } = useGame();

  return (
    <div>
      <div className="back-row" onClick={onBack}>← Back</div>
      <h2 style={{ marginTop: 8 }}>Your Heroes</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ownedList.map((h) => {
          const built = buildUnit(h, "preview", 0, { star: h.star, ascension: h.ascension });
          const cp = computeCP(built);
          const cost = h.star * 120;
          return (
            <div key={h.id} className="hero-card">
              <div className="hero-icon">{h.icon}</div>
              <div style={{ flex: 1 }}>
                <div className="hero-name">{h.name}</div>
                <div className="hero-meta">
                  <span className={`badge badge-${h.role}`}>{h.role}</span> · Star {h.star} · CP {cp}
                </div>
              </div>
              <button
                className="btn btn-secondary"
                disabled={h.star >= 10 || gold < cost}
                onClick={() => levelUpHero(h.id)}
              >
                +1★ ({cost}🪙)
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
