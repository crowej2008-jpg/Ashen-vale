import React from "react";
import { useGame } from "../context/GameContext.jsx";
import { Users, Swords } from "lucide-react";

export default function HomeScreen({ onNavigate }) {
  const { gold, campaignLevel, playerName, formationFilled } = useGame();
  return (
    <div>
      <div className="title">AshenVale</div>
      <div className="subtitle">Welcome back, {playerName}</div>

      <div className="panel" style={{ display: "flex", justifyContent: "space-between", margin: "14px 0" }}>
        <div className="stat-row"><span>🪙 Gold</span></div>
        <b>{gold}</b>
      </div>

      <div className="grid-2">
        <button className="hub-btn" onClick={() => onNavigate("collection")}>
          <div className="icon">🧝</div>Collection
        </button>
        <button className="hub-btn" onClick={() => onNavigate("formation")}>
          <div className="icon">🛡️</div>Formation ({formationFilled.length}/6)
        </button>
        <button className="hub-btn" onClick={() => onNavigate("campaign")}>
          <div className="icon"><Swords size={26} /></div>Campaign · Lv.{campaignLevel}
        </button>
        <button className="hub-btn" onClick={() => onNavigate("multiplayer")}>
          <div className="icon"><Users size={26} /></div>PvP Arena
        </button>
      </div>
    </div>
  );
}
