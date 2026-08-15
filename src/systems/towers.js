/* ==========================================================================
   src/systems/towers.js
   Endless Tower: infinite scaling floors, tough opponents, no ceiling.
   Boss Tower: enemies use different (named) heroes at boosted stats
   versus their normal Campaign versions.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.climbEndlessTower = function climbEndlessTower() {
    if (!AV.isModeUnlocked("endlessTower")) return { error: "Endless Tower is locked." };
    const floor = AV.state.endlessTower.highestFloor + 1;
    const playerTeam = AV.buildPlayerCombatTeam();
    if (!playerTeam.length) return { error: "Place at least one hero in your formation first." };
    const power = 1 + floor * 0.12; // steeper than campaign — "tough opponents"
    const enemyTeam = AV.generateEnemyTeam(6, power);
    const result = AV.runBattle(playerTeam, enemyTeam, 40);

    if (result.winnerSide === "player") {
      AV.state.endlessTower.highestFloor = floor;
      const crystalGain = floor % 10 === 0 ? 2 : 0;
      const goldGain = 300 + floor * 40;
      AV.state.currencies.gold += goldGain;
      if (crystalGain) AV.state.currencies.radiantCrystals += crystalGain;
      AV.logEvent(`Cleared Endless Tower floor ${floor}: +${goldGain} gold${crystalGain ? `, +${crystalGain} Radiant Crystals` : ""}.`);
    }
    AV.save();
    return { ...result, floor };
  };

  const BOSS_NAMES = ["The Cindering Wyrm", "Lord Hollowmaw", "The Unbroken Chorus", "Grael the Undone", "Matriarch of Ash"];

  AV.fightBossTowerFloor = function fightBossTowerFloor() {
    if (!AV.isModeUnlocked("bossTower")) return { error: "Boss Tower is locked." };
    const floor = AV.state.bossTower.highestFloor + 1;
    const playerTeam = AV.buildPlayerCombatTeam();
    if (!playerTeam.length) return { error: "Place at least one hero in your formation first." };

    const power = 1.3 + floor * 0.18; // boosted stats vs. normal campaign enemies
    const boss = AV.generateEnemyTeam(1, power * 2.2)[0];
    boss.name = BOSS_NAMES[(floor - 1) % BOSS_NAMES.length] + ` (Floor ${floor})`;
    const escorts = AV.generateEnemyTeam(2, power);
    const enemyTeam = [boss, ...escorts];
    const result = AV.runBattle(playerTeam, enemyTeam, 40);

    if (result.winnerSide === "player") {
      AV.state.bossTower.highestFloor = floor;
      const goldGain = 500 + floor * 60;
      const stoneGain = 3;
      AV.state.currencies.gold += goldGain;
      AV.grantHeroXpStonesFromCampaign(stoneGain);
      AV.logEvent(`Defeated ${boss.name}: +${goldGain} gold, +${stoneGain} Hero XP Stones.`);
    }
    AV.save();
    return { ...result, floor };
  };
})(window.AV);
