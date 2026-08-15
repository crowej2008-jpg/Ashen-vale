import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { HEROES } from "@ashenvale/shared";

const SAVE_KEY = "ashenvale_save_v1";
const STARTER_IDS = ["kael", "orin", "elara", "mira", "zerin", "wren", "thrand", "petra"];

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore corrupt save */ }
  const owned = {};
  for (const id of STARTER_IDS) owned[id] = { star: 1, ascension: 0 };
  return {
    owned,
    formation: [STARTER_IDS[0], STARTER_IDS[1], STARTER_IDS[2], STARTER_IDS[3], STARTER_IDS[4], STARTER_IDS[5]],
    gold: 500,
    campaignLevel: 1,
    playerName: "Commander",
  };
}

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, setState] = useState(loadSave);

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }, [state]);

  const ownedList = useMemo(
    () => Object.keys(state.owned).map((id) => ({ ...HEROES.find((h) => h.id === id), ...state.owned[id] })),
    [state.owned]
  );

  const formationFilled = state.formation.filter(Boolean);

  const api = {
    ...state,
    ownedList,
    formationFilled,
    setPlayerName: (name) => setState((s) => ({ ...s, playerName: name.slice(0, 24) || "Commander" })),
    setFormationSlot: (index, heroId) =>
      setState((s) => {
        const formation = [...s.formation];
        // a hero can only occupy one slot at a time
        for (let i = 0; i < formation.length; i++) if (formation[i] === heroId) formation[i] = null;
        formation[index] = heroId;
        return { ...s, formation };
      }),
    clearSlot: (index) =>
      setState((s) => {
        const formation = [...s.formation];
        formation[index] = null;
        return { ...s, formation };
      }),
    levelUpHero: (heroId) =>
      setState((s) => {
        const owned = s.owned[heroId];
        if (!owned) return s;
        const cost = owned.star * 120;
        if (owned.star >= 10 || s.gold < cost) return s;
        return { ...s, gold: s.gold - cost, owned: { ...s.owned, [heroId]: { ...owned, star: owned.star + 1 } } };
      }),
    addGold: (amount) => setState((s) => ({ ...s, gold: Math.max(0, s.gold + amount) })),
    winCampaign: (goldReward) =>
      setState((s) => ({ ...s, gold: s.gold + goldReward, campaignLevel: s.campaignLevel + 1 })),
    resetSave: () => {
      localStorage.removeItem(SAVE_KEY);
      setState(loadSave());
    },
  };

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
