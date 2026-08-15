import React, { useState } from "react";
import { useGame } from "../context/GameContext.jsx";
import { HEROES_BY_ID } from "@ashenvale/shared";

export default function FormationScreen({ onBack }) {
  const { formation, setFormationSlot, clearSlot, ownedList } = useGame();
  const [pickerSlot, setPickerSlot] = useState(null);

  return (
    <div>
      <div className="back-row" onClick={onBack}>← Back</div>
      <h2 style={{ marginTop: 8 }}>Formation</h2>
      <p className="hero-meta">Front row (slots 1-3) takes hits first; back row (4-6) is protected while a front-liner survives.</p>

      <div className="formation-row" style={{ marginBottom: 8 }}>
        <div className="grid-3">
          {[0, 1, 2].map((i) => (
            <SlotBox key={i} hero={formation[i] ? HEROES_BY_ID[formation[i]] : null} onClick={() => setPickerSlot(i)} label={`Front ${i + 1}`} />
          ))}
        </div>
        <div className="formation-row-label">FRONT ROW</div>
      </div>
      <div className="formation-row" style={{ marginBottom: 14 }}>
        <div className="grid-3">
          {[3, 4, 5].map((i) => (
            <SlotBox key={i} hero={formation[i] ? HEROES_BY_ID[formation[i]] : null} onClick={() => setPickerSlot(i)} label={`Back ${i - 2}`} />
          ))}
        </div>
        <div className="formation-row-label">BACK ROW</div>
      </div>

      {pickerSlot !== null && (
        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <b>Choose a hero</b>
            <span className="back-row" onClick={() => setPickerSlot(null)}>Close</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
            {formation[pickerSlot] && (
              <div className="hero-card" onClick={() => { clearSlot(pickerSlot); setPickerSlot(null); }}>
                <div className="hero-icon">✖️</div>
                <div className="hero-name">Clear slot</div>
              </div>
            )}
            {ownedList.map((h) => (
              <div
                key={h.id}
                className={`hero-card ${formation[pickerSlot] === h.id ? "selected" : ""}`}
                onClick={() => { setFormationSlot(pickerSlot, h.id); setPickerSlot(null); }}
              >
                <div className="hero-icon">{h.icon}</div>
                <div style={{ flex: 1 }}>
                  <div className="hero-name">{h.name}</div>
                  <div className="hero-meta"><span className={`badge badge-${h.role}`}>{h.role}</span> · Star {h.star}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SlotBox({ hero, onClick, label }) {
  return (
    <button className={`slot-box ${hero ? "filled" : ""}`} onClick={onClick}>
      {hero ? (
        <>
          <div style={{ fontSize: 22 }}>{hero.icon}</div>
          <div className="slot-label">{hero.name.split(" ")[0]}</div>
        </>
      ) : (
        <div className="slot-label">{label}</div>
      )}
    </button>
  );
}
