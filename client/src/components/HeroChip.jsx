import React from "react";
import HpBar from "./HpBar.jsx";

export default function HeroChip({ unit, active }) {
  const dead = !unit.alive;
  const energyPct = Math.max(0, Math.min(100, (unit.energy / unit.energyMax) * 100));
  return (
    <div className={`hero-chip ${dead ? "dead" : ""} ${active ? "active" : ""}`}>
      <div className="icon">{unit.icon}</div>
      <div className="name">{unit.name}</div>
      <HpBar hp={unit.hp} maxHp={unit.maxHp} />
      <div className="energy-bar"><div className="energy-fill" style={{ width: `${energyPct}%` }} /></div>
    </div>
  );
}
