/* ==========================================================================
   src/systems/campaign.js
   Campaign: 700 levels (original 200 + 500 new). Opponents scale 9%
   stronger every 50 levels. Clearing a level grants player XP (and some
   Hero XP Stones / gold).
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.CAMPAIGN_MAX_LEVEL = 700;

  AV.campaignPowerMult = function campaignPowerMult(level) {
    const tier = Math.floor((level - 1) / 50);
    return Math.pow(1.09, tier) * (0.9 + level * 0.004);
  };

  AV.campaignEnemyCount = function campaignEnemyCount(level) {
    return AV.clamp(3 + Math.floor(level / 100), 3, 6);
  };

  AV.fightCampaignLevel = function fightCampaignLevel(level) {
    if (!AV.isModeUnlocked("campaign")) return { error: "Campaign is locked." };
    if (level > AV.state.campaign.highestLevelCleared + 1) {
      return { error: "Clear the previous level first." };
    }
    if (level < 1 || level > AV.CAMPAIGN_MAX_LEVEL) return { error: "Invalid campaign level." };

    const playerTeam = AV.buildPlayerCombatTeam();
    if (!playerTeam.length) return { error: "Place at least one hero in your formation first." };
    const enemyTeam = AV.generateEnemyTeam(AV.campaignEnemyCount(level), AV.campaignPowerMult(level));
    const result = AV.runBattle(playerTeam, enemyTeam);

    if (result.winnerSide === "player") {
      if (level > AV.state.campaign.highestLevelCleared) {
        AV.state.campaign.highestLevelCleared = level;
      }
      const goldGain = 200 + level * 15;
      const xpGain = 40 + level * 6;
      const stoneGain = 2 + Math.floor(level / 25);
      AV.state.currencies.gold += goldGain;
      AV.grantHeroXpStonesFromCampaign(stoneGain);
      AV.grantPlayerXp(xpGain);
      AV.logEvent(`Cleared Campaign level ${level}: +${goldGain} gold, +${stoneGain} Hero XP Stones, +${xpGain} XP.`);
      AV.save();
      return { ...result, rewards: { gold: goldGain, xp: xpGain, heroXpStones: stoneGain } };
    }
    AV.save();
    return { ...result, rewards: null };
  };
})(window.AV);
