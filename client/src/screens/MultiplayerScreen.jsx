import React, { useEffect, useState } from "react";
import { useGame } from "../context/GameContext.jsx";
import { socket } from "../socket.js";
import BattleView from "../components/BattleView.jsx";

export default function MultiplayerScreen({ onBack }) {
  const { formation, owned, playerName, setPlayerName } = useGame();
  const [phase, setPhase] = useState("idle"); // idle | queueing | battle | result
  const [error, setError] = useState(null);
  const [battleMeta, setBattleMeta] = useState(null); // { youAre, you, opponent, units }
  const [steps, setSteps] = useState([]);
  const [result, setResult] = useState(null);

  const teamFormation = formation
    .filter(Boolean)
    .map((heroId) => ({ heroId, star: owned[heroId]?.star || 1, ascension: owned[heroId]?.ascension || 0 }));

  useEffect(() => {
    socket.connect();

    function onQueued() { setPhase("queueing"); setError(null); }
    function onQueueError(e) { setError(e.message); setPhase("idle"); }
    function onBattleStart(payload) {
      setBattleMeta(payload);
      setSteps([]);
      setResult(null);
      setPhase("battle");
    }
    function onBattleStep({ step }) {
      setSteps((prev) => [...prev, step]);
    }
    function onBattleEnd(payload) {
      setResult(payload.winner);
      setPhase("result");
    }

    socket.on("queue:joined", onQueued);
    socket.on("queue:error", onQueueError);
    socket.on("battle:start", onBattleStart);
    socket.on("battle:step", onBattleStep);
    socket.on("battle:end", onBattleEnd);

    return () => {
      socket.off("queue:joined", onQueued);
      socket.off("queue:error", onQueueError);
      socket.off("battle:start", onBattleStart);
      socket.off("battle:step", onBattleStep);
      socket.off("battle:end", onBattleEnd);
      socket.emit("queue:leave");
      socket.disconnect();
    };
  }, []);

  function findMatch() {
    if (teamFormation.length === 0) { setError("Build a formation first."); return; }
    socket.emit("queue:join", { name: playerName, formation: teamFormation });
  }

  if (phase === "battle" && battleMeta) {
    return (
      <div>
        <BattleView
          initialUnits={battleMeta.units}
          steps={steps}
          youSide={battleMeta.youAre}
          yourLabel={`${battleMeta.you.name.toUpperCase()} (YOU)`}
          opponentLabel={battleMeta.opponent.name}
          mode="live"
        />
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="center-col">
        <div className="big-emoji">{result === "you" ? "🏆" : "💀"}</div>
        <h2>{result === "you" ? "Victory!" : "Defeat"}</h2>
        <p className="hero-meta">Real-time PvP battle complete.</p>
        <div className="grid-2" style={{ width: "100%" }}>
          <button className="btn btn-secondary" onClick={onBack}>Home</button>
          <button className="btn btn-primary" onClick={() => { setPhase("idle"); setResult(null); }}>Queue Again</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="back-row" onClick={onBack}>← Back</div>
      <h2 style={{ marginTop: 8 }}>PvP Arena</h2>
      <div className="panel">
        <div style={{ marginBottom: 10 }}>
          <div className="hero-meta" style={{ marginBottom: 4 }}>Commander name</div>
          <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
        </div>
        <p className="hero-meta">
          Queues you against another live player. A server runs the battle authoritatively and streams it to both of you in real time — no scrubbing back, what you see is happening now.
        </p>
        {error && <p className="error-text">{error}</p>}
        {phase === "queueing" ? (
          <div className="queue-status">
            <div className="pulse">🔎 Searching for an opponent…</div>
            <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => { socket.emit("queue:leave"); setPhase("idle"); }}>Cancel</button>
          </div>
        ) : (
          <button className="btn btn-primary btn-block" onClick={findMatch}>Find Match</button>
        )}
      </div>
    </div>
  );
}
