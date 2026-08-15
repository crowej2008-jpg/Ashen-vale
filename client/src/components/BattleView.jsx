import React, { useEffect, useMemo, useRef, useState } from "react";
import HeroChip from "./HeroChip.jsx";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";

// Renders a formation battle from a sequence of engine snapshot "steps".
// mode="replay": full steps array is known up front (PvE); user can play/pause/scrub.
// mode="live":   steps arrive incrementally over the socket (PvP); we just
//                always show the latest one and auto-scroll the log.
export default function BattleView({ initialUnits, steps, youSide, yourLabel, opponentLabel, mode, onViewResults }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(mode === "live");
  const [speed, setSpeed] = useState(700);
  const logEndRef = useRef(null);

  useEffect(() => {
    if (mode === "live") setIndex(Math.max(0, steps.length - 1));
  }, [mode, steps.length]);

  useEffect(() => {
    if (mode !== "replay" || !playing) return;
    if (index >= steps.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setIndex((i) => Math.min(steps.length - 1, i + 1)), speed);
    return () => clearTimeout(t);
  }, [mode, playing, index, steps.length, speed]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [index]);

  const curStep = steps[index];
  const visibleLog = useMemo(() => steps.slice(0, index + 1).flatMap((s) => s.messages), [steps, index]);

  if (!curStep) {
    return <div className="queue-status pulse">Connecting battle feed...</div>;
  }

  const youUnits = initialUnits.filter((u) => u.side === youSide);
  const oppUnits = initialUnits.filter((u) => u.side !== youSide);
  const withState = (u) => ({ ...u, hp: curStep.hp[u.uid], shield: curStep.shield[u.uid], alive: curStep.alive[u.uid], energy: curStep.energy[u.uid] });

  return (
    <div className="battle-view">
      <div className="panel" style={{ marginBottom: 10 }}>
        <div className="tag-opp" style={{ marginBottom: 6 }}>{opponentLabel}</div>
        <div className="grid-3" style={{ marginBottom: 6 }}>
          {oppUnits.filter((u) => u.row === "front").map((u) => <HeroChip key={u.uid} unit={withState(u)} active={curStep.actorUid === u.uid} />)}
        </div>
        <div className="grid-3">
          {oppUnits.filter((u) => u.row === "back").map((u) => <HeroChip key={u.uid} unit={withState(u)} active={curStep.actorUid === u.uid} />)}
        </div>
      </div>

      <div className="battle-log" style={{ marginBottom: 10 }}>
        {visibleLog.slice(-40).map((m, i) => <div key={i}>{m}</div>)}
        <div ref={logEndRef} />
      </div>

      <div className="panel">
        <div className="grid-3" style={{ marginBottom: 6 }}>
          {youUnits.filter((u) => u.row === "front").map((u) => <HeroChip key={u.uid} unit={withState(u)} active={curStep.actorUid === u.uid} />)}
        </div>
        <div className="grid-3" style={{ marginBottom: 6 }}>
          {youUnits.filter((u) => u.row === "back").map((u) => <HeroChip key={u.uid} unit={withState(u)} active={curStep.actorUid === u.uid} />)}
        </div>
        <div className="tag-you" style={{ textAlign: "center" }}>{yourLabel}</div>
      </div>

      {mode === "replay" && (
        <div className="controls-row" style={{ marginTop: 12 }}>
          <button className="icon-btn" onClick={() => setIndex((i) => Math.max(0, i - 1))}><RotateCcw size={16} /></button>
          {index < steps.length - 1 ? (
            <button className="play-btn" onClick={() => setPlaying((p) => !p)}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
          ) : (
            <button className="btn btn-primary" onClick={onViewResults}>View Results</button>
          )}
          <button className="icon-btn" onClick={() => setIndex(steps.length - 1)}><SkipForward size={16} /></button>
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="btn-secondary" style={{ borderRadius: 8, padding: "8px" }}>
            <option value={900}>1x</option>
            <option value={400}>2x</option>
            <option value={150}>4x</option>
          </select>
        </div>
      )}
      {mode === "live" && (
        <div className="controls-row" style={{ marginTop: 12 }}>
          <span className="tag-you pulse">● LIVE — step {index + 1}</span>
        </div>
      )}
    </div>
  );
}
