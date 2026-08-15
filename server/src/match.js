import { HEROES_BY_ID, buildSideFromFormation, simulateBattle } from "@ashenvale/shared";

const MAX_TEAM_SIZE = 6;
const MAX_STAR = 10;

// Sanitize a formation payload sent by a client. Never trust client input:
// only heroId/star/ascension survive, and all stats are recomputed server-side
// from the shared hero table, so a client cannot forge stats to cheat.
export function sanitizeFormation(formation) {
  if (!Array.isArray(formation)) return [];
  return formation
    .filter((f) => f && typeof f.heroId === "string" && HEROES_BY_ID[f.heroId])
    .slice(0, MAX_TEAM_SIZE)
    .map((f) => ({
      heroId: f.heroId,
      star: Math.max(1, Math.min(MAX_STAR, Number.isFinite(f.star) ? Math.round(f.star) : 1)),
      ascension: Math.max(0, Math.min(5, Number.isFinite(f.ascension) ? Math.round(f.ascension) : 0)),
    }));
}

// Runs the authoritative simulation once, then streams it turn-by-turn to
// both sockets in a room so it plays out "live" and in sync for both players,
// each seeing themselves on the bottom regardless of which internal side
// ("player"/"enemy") the engine assigned them.
export function runLiveBattle(io, roomId, playerA, playerB, speedMs = 1100) {
  const unitsA = buildSideFromFormation(playerA.formation, "player");
  const unitsB = buildSideFromFormation(playerB.formation, "enemy");

  const result = simulateBattle(unitsA, unitsB);

  const publicUnit = (u) => ({
    uid: u.uid, tplId: u.tplId, name: u.name, icon: u.icon, role: u.role,
    side: u.side, slot: u.slot, row: u.row, maxHp: u.maxHp, energyMax: u.energyMax,
  });

  for (const [me, opp] of [[playerA, playerB], [playerB, playerA]]) {
    io.to(me.socketId).emit("battle:start", {
      roomId,
      youAre: me === playerA ? "player" : "enemy",
      you: { name: me.name },
      opponent: { name: opp.name },
      units: [...unitsA, ...unitsB].map(publicUnit),
      totalSteps: result.steps.length,
    });
  }

  let i = 0;
  const timer = setInterval(() => {
    if (i >= result.steps.length) {
      clearInterval(timer);
      for (const [me, opp] of [[playerA, playerB], [playerB, playerA]]) {
        const iWon = result.winner === (me === playerA ? "player" : "enemy");
        io.to(me.socketId).emit("battle:end", { winner: iWon ? "you" : "opponent" });
      }
      return;
    }
    const step = result.steps[i];
    io.to(playerA.socketId).emit("battle:step", { index: i, step });
    io.to(playerB.socketId).emit("battle:step", { index: i, step });
    i++;
  }, speedMs);

  return { timer, result };
}
