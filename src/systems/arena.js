/* ==========================================================================
   src/systems/arena.js
   PvP Arena: Elo rating (+50 win / -10 loss). Ranks are locked behind Elo
   thresholds, not win counts. Higher rank -> more Arena Tokens per battle
   (base 5, increasing with rank). No Summoning Scrolls / Artifact Stones
   awarded directly by Arena anymore. Players can preview the opponent's
   individual hero details before committing to a formation.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.ARENA_RANKS = [
    { name: "Bronze", minElo: 0, tokens: 5 },
    { name: "Silver", minElo: 1050, tokens: 8 },
    { name: "Gold", minElo: 1150, tokens: 12 },
    { name: "Platinum", minElo: 1300, tokens: 18 },
    { name: "Diamond", minElo: 1500, tokens: 25 },
    { name: "Mythic", minElo: 1750, tokens: 35 },
  ];

  AV.currentArenaRank = function currentArenaRank() {
    const elo = AV.state.player.elo;
    return [...AV.ARENA_RANKS].reverse().find((r) => elo >= r.minElo) || AV.ARENA_RANKS[0];
  };

  /** Builds a synthetic opponent formation (viewable before the match). */
  AV.generateArenaOpponent = function generateArenaOpponent() {
    const eloVariance = AV.randInt(-100, 100);
    const power = AV.clamp((AV.state.player.elo + eloVariance) / 1000, 0.5, 3);
    const count = 6;
    const templates = [];
    for (let i = 0; i < count; i++) {
      templates.push(AV.HERO_TEMPLATES[AV.randInt(0, AV.HERO_TEMPLATES.length - 1)]);
    }
    return {
      name: `Rival ${AV.randInt(1000, 9999)}`,
      elo: AV.clamp(AV.state.player.elo + eloVariance, 800, 2200),
      power,
      heroes: templates.map((tpl) => ({
        template: tpl,
        previewStats: { ...tpl.baseStats, hp: Math.round(tpl.baseStats.hp * power), attack: Math.round(tpl.baseStats.attack * power) },
      })),
    };
  };

  AV.fightArenaOpponent = function fightArenaOpponent(opponent) {
    if (!AV.isModeUnlocked("arena")) return { error: "Arena is locked." };
    const playerTeam = AV.buildPlayerCombatTeam();
    if (!playerTeam.length) return { error: "Place at least one hero in your formation first." };
    const enemyTeam = AV.generateEnemyTeam(opponent.heroes.length, opponent.power);
    const result = AV.runBattle(playerTeam, enemyTeam);

    const rank = AV.currentArenaRank();
    if (result.winnerSide === "player") {
      AV.state.player.elo += 50;
      AV.state.currencies.arenaTokens += rank.tokens;
      AV.logEvent(`Arena victory vs ${opponent.name}: +50 Elo, +${rank.tokens} Arena Tokens.`);
    } else {
      AV.state.player.elo = Math.max(0, AV.state.player.elo - 10);
      AV.logEvent(`Arena defeat vs ${opponent.name}: -10 Elo.`);
    }
    AV.save();
    return { ...result, eloAfter: AV.state.player.elo, rank: AV.currentArenaRank() };
  };
})(window.AV);
