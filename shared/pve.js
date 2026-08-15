import { HEROES } from "./heroes.js";
import { rnd, sample, assignRows, buildUnit } from "./engine.js";

export function buildCampaignTeam(level) {
  const count = Math.max(3, Math.min(6, 3 + Math.floor((level - 1) / 15)));
  const picks = [];
  for (let i = 0; i < count; i++) picks.push(HEROES[rnd(HEROES.length)]);
  const rows = assignRows(picks);
  let statMult = 1 + (level - 1) * 0.022;
  const milestone = level % 25 === 0;
  if (milestone) statMult *= 1.12;
  return rows.map((t, i) => buildUnit(t, "enemy", i, { statMult, namePrefix: milestone ? "🔥Champion " : "" }));
}

export function buildArenaTeam(playerPower) {
  const SQUAD_ADJ = ["Iron", "Crimson", "Shadow", "Storm", "Ashen", "Void", "Ember", "Frost", "Grim", "Wild"];
  const SQUAD_NOUN = ["Vultures", "Wardens", "Reavers", "Sentinels", "Fangs", "Vanguard", "Hollow", "Cinders", "Talons", "Oathbreakers"];
  const picks = sample(HEROES, 6);
  const rows = assignRows(picks);
  const basePower = rows.reduce((s, t) => s + (t.baseHp / 8 + t.baseAtk * 1.8 + t.baseDef * 1.5 + t.baseSpd), 0);
  const variance = 0.8 + Math.random() * 0.3;
  const scale = Math.max(0.6, Math.min(1.3, (playerPower / Math.max(1, basePower)) * variance));
  const squadName = `${SQUAD_ADJ[rnd(SQUAD_ADJ.length)]} ${SQUAD_NOUN[rnd(SQUAD_NOUN.length)]}`;
  return { squadName, units: rows.map((t, i) => buildUnit(t, "enemy", i, { statMult: scale })) };
}
