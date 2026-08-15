/* ==========================================================================
   src/systems/leveling.js
   Hero leveling (independent of evolution): 1-100 using Hero XP Stones,
   earned from Campaign and purchasable from the Arena Shop.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.HERO_LEVEL_CAP = 100;
  AV.XP_STONE_VALUE = 50;

  AV.xpToNextHeroLevel = function xpToNextHeroLevel(level) {
    return Math.round(120 * Math.pow(level, 1.35));
  };

  AV.levelUpHeroWithStones = function levelUpHeroWithStones(instanceId, stoneCount) {
    const inst = AV.state.heroInstances[instanceId];
    if (!inst) return { error: "Hero not found." };
    if (inst.level >= AV.HERO_LEVEL_CAP) return { error: "Hero is already at max level (100)." };
    if (AV.state.currencies.heroXpStones < stoneCount) return { error: "Not enough Hero XP Stones." };

    AV.state.currencies.heroXpStones -= stoneCount;
    let xpGain = stoneCount * AV.XP_STONE_VALUE;
    inst.xp += xpGain;

    while (inst.level < AV.HERO_LEVEL_CAP) {
      const need = AV.xpToNextHeroLevel(inst.level);
      if (inst.xp < need) break;
      inst.xp -= need;
      inst.level += 1;
    }
    if (inst.level >= AV.HERO_LEVEL_CAP) inst.xp = 0;

    AV.save();
    return { ok: true, newLevel: inst.level };
  };

  AV.grantHeroXpStonesFromCampaign = function grantHeroXpStonesFromCampaign(amount) {
    AV.state.currencies.heroXpStones += amount;
  };
})(window.AV);
