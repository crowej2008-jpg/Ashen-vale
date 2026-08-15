import React from "react";

export default function HpBar({ hp, maxHp }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const cls = pct > 50 ? "hp-high" : pct > 20 ? "hp-mid" : "hp-low";
  return (
    <div className="hp-bar">
      <div className={`hp-fill ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
