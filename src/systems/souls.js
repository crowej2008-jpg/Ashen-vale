/* ==========================================================================
   src/systems/souls.js
   Soul Statue: consumes Hero Souls (produced by disassembling heroes,
   graded by the source hero's grade) to upgrade flat stats that apply
   globally, to every hero.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  const PER_LEVEL_BONUS = { hp: 40, attack: 6, defense: 4 };

  AV.soulStatueBonus = function soulStatueBonus() {
    const lvl = AV.state.soulStatueLevel;
    return { hp: PER_LEVEL_BONUS.hp * lvl, attack: PER_LEVEL_BONUS.attack * lvl, defense: PER_LEVEL_BONUS.defense * lvl };
  };

  /** Cost scales with level; higher-grade souls are weighted more heavily. */
  AV.nextSoulStatueCost = function nextSoulStatueCost() {
    const lvl = AV.state.soulStatueLevel;
    return { 1: 5 + lvl, 2: 3 + Math.floor(lvl * 0.8), 3: 2 + Math.floor(lvl * 0.6), 4: 1 + Math.floor(lvl * 0.4), 5: Math.floor(lvl * 0.25) };
  };

  AV.canAffordSoulStatueUpgrade = function canAffordSoulStatueUpgrade() {
    const cost = AV.nextSoulStatueCost();
    return Object.entries(cost).every(([grade, amt]) => (AV.state.heroSouls[grade] || 0) >= amt);
  };

  AV.upgradeSoulStatue = function upgradeSoulStatue() {
    const cost = AV.nextSoulStatueCost();
    if (!AV.canAffordSoulStatueUpgrade()) return { error: "Not enough Hero Souls." };
    Object.entries(cost).forEach(([grade, amt]) => { AV.state.heroSouls[grade] -= amt; });
    AV.state.soulStatueLevel += 1;
    AV.save();
    return { ok: true, newLevel: AV.state.soulStatueLevel };
  };
})(window.AV);
