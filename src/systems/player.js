/* ==========================================================================
   src/systems/player.js
   Player level cap 200. XP earned from clearing Campaign levels. Milestone
   rewards: every 5 levels +100 atk/def/hp & 10 Summoning Scrolls; every 20
   levels 3 Radiant Crystals; every 50 levels 100 Divine Stones (unused for
   now — reserved for a later system).
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.PLAYER_LEVEL_CAP = 200;

  AV.xpToNextPlayerLevel = function xpToNextPlayerLevel(level) {
    return Math.round(500 * Math.pow(level, 1.22));
  };

  // Mode unlock levels — all below 50. Currently switched OFF (see AV.MODE_GATING_ENABLED).
  AV.MODE_GATING_ENABLED = false;
  AV.MODE_UNLOCK_LEVELS = {
    endlessTower: 20,
    arena: 15,
    bossTower: 30,
    armorDungeon: 10,
  };

  AV.isModeUnlocked = function isModeUnlocked(mode) {
    if (!AV.MODE_GATING_ENABLED) return true;
    return AV.state.player.level >= (AV.MODE_UNLOCK_LEVELS[mode] || 0);
  };

  AV.globalPlayerBonus = function globalPlayerBonus() {
    const milestones5 = Math.floor(AV.state.player.level / 5);
    return { attack: milestones5 * 100, defense: milestones5 * 100, hp: milestones5 * 100 };
  };

  AV.grantPlayerXp = function grantPlayerXp(amount) {
    const p = AV.state.player;
    if (p.level >= AV.PLAYER_LEVEL_CAP) return;
    p.xp += amount;
    while (p.level < AV.PLAYER_LEVEL_CAP) {
      const need = AV.xpToNextPlayerLevel(p.level);
      if (p.xp < need) break;
      p.xp -= need;
      p.level += 1;
      applyMilestoneRewards(p.level);
    }
    if (p.level >= AV.PLAYER_LEVEL_CAP) p.xp = 0;
    AV.save();
  };

  function applyMilestoneRewards(level) {
    const rewards = [];
    if (level % 5 === 0) {
      AV.state.currencies.summoningScrolls += 10;
      rewards.push("+100 ATK/DEF/HP (global)", "10 Summoning Scrolls");
    }
    if (level % 20 === 0) {
      AV.state.currencies.radiantCrystals += 3;
      rewards.push("3 Radiant Crystals");
    }
    if (level % 50 === 0) {
      AV.state.currencies.divineStones += 100;
      rewards.push("100 Divine Stones");
    }
    if (rewards.length) AV.logEvent(`Reached player level ${level}! Rewards: ${rewards.join(", ")}.`);
  }
})(window.AV);
