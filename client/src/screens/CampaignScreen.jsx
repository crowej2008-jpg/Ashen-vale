import React, { useState } from "react";
import { useGame } from "../context/GameContext.jsx";
import { HEROES_BY_ID, buildUnit, simulateBattle, buildCampaignTeam } from "@ashenvale/shared";
import BattleView from "../components/BattleView.jsx";

function campaignReward(level) { return 80 + level * 12; }

export default function CampaignScreen({ onBack }) {
  const { formation, owned, campaignLevel, winCampaign } = useGame();
  const [battle, setBattle] = useState(null); // { playerUnits, enemyUnits, result }
  const [result, setResult] = useState(null); // "win" | "lose"

  const canFight = formation.filter(Boolean).length > 0;

  function startBattle() {
    const playerUnits = formation
      .map((heroId, i) => (heroId ? buildUnit(HEROES_BY_ID[heroId], "player", i, { star: owned[heroId]?.star || 1, ascension: owned[heroId]?.ascension || 0 }) : null))
      .filter(Boolean);
    const enemyUnits = buildCampaignTeam(campaignLevel);
    const sim = simulateBattle(playerUnits, enemyUnits);
    setBattle({ playerUnits, enemyUnits, sim });
    setResult(null);
  }

  function finishBattle() {
    const win = battle.sim.winner === "player";
    if (win) winCampaign(campaignReward(campaignLevel));
    setResult(win ? "win" : "lose");
  }

  if (battle && !result) {
    return (
      <div>
        <div className="back-row" onClick={() => setBattle(null)}>← Back</div>
        <BattleView
          initialUnits={[...battle.playerUnits, ...battle.enemyUnits]}
          steps={battle.sim.steps}
          youSide="player"
          yourLabel="YOUR FORMATION"
          opponentLabel={`Campaign Lv.${campaignLevel} Foes`}
          mode="replay"
          onViewResults={finishBattle}
        />
      </div>
    );
  }

  if (result) {
    return (
      <div className="center-col">
        <div className="big-emoji">{result === "win" ? "🏆" : "💀"}</div>
        <h2>{result === "win" ? "Victory" : "Defeat"}</h2>
        <p className="hero-meta">{result === "win" ? `+${campaignReward(campaignLevel - 1)} gold · Level up!` : "Strengthen your formation and try again."}</p>
        <div className="grid-2" style={{ width: "100%" }}>
          <button className="btn btn-secondary" onClick={onBack}>Home</button>
          <button className="btn btn-primary" onClick={() => { setBattle(null); setResult(null); }}>Continue</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="back-row" onClick={onBack}>← Back</div>
      <h2 style={{ marginTop: 8 }}>Campaign</h2>
      <div className="panel center-col">
        <div className="big-emoji">⚔️</div>
        <div>Level {campaignLevel}</div>
        <p className="hero-meta">Fight a procedurally-scaled enemy warband with your saved formation.</p>
        {!canFight && <p className="error-text">Build a formation first.</p>}
        <button className="btn btn-primary btn-block" disabled={!canFight} onClick={startBattle}>Start Battle</button>
      </div>
    </div>
  );
}
