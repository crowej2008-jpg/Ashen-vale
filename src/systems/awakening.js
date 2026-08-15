/* ==========================================================================
   src/systems/awakening.js
   Awakening Hall: unlocks at player level 150. Spend Radiant Crystals to
   awaken a hero, adding stats/bonuses that scale with tier (E- lowest to
   SSS highest, 10 tiers total).
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.AWAKENING_UNLOCK_PLAYER_LEVEL = 150;

  AV.isAwakeningHallUnlocked = function isAwakeningHallUnlocked() {
    return AV.state.player.level >= AV.AWAKENING_UNLOCK_PLAYER_LEVEL;
  };

  AV.awakeningCrystalCost = function awakeningCrystalCost(currentTier) {
    return 3 + (currentTier + 1) * 2; // tier -1 (none) -> first awaken costs 3
  };

  AV.awakenHero = function awakenHero(instanceId) {
    if (!AV.isAwakeningHallUnlocked()) {
      return { error: `Awakening Hall unlocks at player level ${AV.AWAKENING_UNLOCK_PLAYER_LEVEL}.` };
    }
    const inst = AV.state.heroInstances[instanceId];
    if (!inst) return { error: "Invalid hero." };
    if (inst.awakeningTier >= AV.AWAKENING_TIERS.length - 1) return { error: "Already at max awakening tier (SSS)." };
    const cost = AV.awakeningCrystalCost(inst.awakeningTier);
    if (AV.state.currencies.radiantCrystals < cost) return { error: `Need ${cost} Radiant Crystals.` };
    AV.state.currencies.radiantCrystals -= cost;
    inst.awakeningTier += 1;
    AV.save();
    return { ok: true, newTier: AV.AWAKENING_TIERS[inst.awakeningTier] };
  };
})(window.AV);
