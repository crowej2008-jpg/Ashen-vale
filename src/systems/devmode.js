/* ==========================================================================
   src/systems/devmode.js
   Developer tools panel: currency/resource cheats, hero unlocking &
   stat-maxing, guaranteed loot, progress skips, raw save-state viewer,
   and a reset-everything option.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.dev = {};

  AV.dev.addCurrency = function addCurrency(key, amount) {
    if (!(key in AV.state.currencies)) return { error: "Unknown currency." };
    AV.state.currencies[key] += amount;
    AV.save();
    return { ok: true };
  };

  AV.dev.unlockAllHeroes = function unlockAllHeroes() {
    AV.HERO_TEMPLATES.forEach((tpl) => {
      if (AV.copiesOwned(tpl.id) === 0) AV.grantHero(tpl.id);
    });
    AV.save();
    return { ok: true };
  };

  AV.dev.maxStatsHero = function maxStatsHero(instanceId) {
    const inst = AV.state.heroInstances[instanceId];
    if (!inst) return { error: "Invalid hero." };
    inst.stars = 10;
    inst.level = AV.HERO_LEVEL_CAP;
    inst.xp = 0;
    inst.awakeningTier = AV.AWAKENING_TIERS.length - 1;
    AV.save();
    return { ok: true };
  };

  AV.dev.guaranteedLoot = function guaranteedLoot() {
    AV.state.currencies.summoningScrolls += 50;
    AV.state.currencies.artifactStones += 50;
    AV.state.currencies.gold += 1_000_000;
    AV.state.currencies.arenaTokens += 500;
    AV.state.currencies.radiantCrystals += 200;
    AV.state.currencies.heroXpStones += 5000;
    AV.state.currencies.divineStones += 1000;
    AV.state.armorSouls += 200;
    [1, 2, 3, 4, 5].forEach((g) => { AV.state.heroSouls[g] += 100; });
    AV.save();
    return { ok: true };
  };

  AV.dev.skipCampaignTo = function skipCampaignTo(level) {
    AV.state.campaign.highestLevelCleared = AV.clamp(level, 0, AV.CAMPAIGN_MAX_LEVEL);
    AV.save();
    return { ok: true };
  };

  AV.dev.setPlayerLevel = function setPlayerLevel(level) {
    AV.state.player.level = AV.clamp(level, 1, AV.PLAYER_LEVEL_CAP);
    AV.state.player.xp = 0;
    AV.save();
    return { ok: true };
  };

  AV.dev.setElo = function setElo(elo) {
    AV.state.player.elo = Math.max(0, elo);
    AV.save();
    return { ok: true };
  };

  AV.dev.rawState = function rawState() {
    return AV.exportSave();
  };

  AV.dev.resetEverything = function resetEverything() {
    AV.hardReset();
    return { ok: true };
  };
})(window.AV);
