/* ==========================================================================
   src/ui/screens/campaignScreen.js
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.screens.campaign = function campaignScreen(container) {
    const cleared = AV.state.campaign.highestLevelCleared;
    const nextLevel = Math.min(cleared + 1, AV.CAMPAIGN_MAX_LEVEL);

    container.appendChild(AV.el("div", { class: "screen" }, [
      AV.el("h1", {}, "Campaign"),
      AV.el("div", { class: "empty-note" }, `Cleared ${cleared} / ${AV.CAMPAIGN_MAX_LEVEL}. Enemies scale 9% stronger every 50 levels.`),
      AV.el("div", { class: "progress-bar" }, [AV.el("div", { class: "progress-fill", style: `width:${(cleared / AV.CAMPAIGN_MAX_LEVEL) * 100}%` })]),
      AV.el("div", { class: "panel" }, [
        AV.el("h3", {}, `Next: Level ${nextLevel}`),
        AV.el("div", {}, `Enemies: ${AV.campaignEnemyCount(nextLevel)} · Power ×${AV.campaignPowerMult(nextLevel).toFixed(2)}`),
        AV.el("button", { class: "btn", onclick: () => {
          const r = AV.fightCampaignLevel(nextLevel);
          if (r.error) { AV.toast(r.error, true); return; }
          AV.rerender();
          AV.showBattleResult(r, r.rewards ? `+${r.rewards.gold} gold, +${r.rewards.heroXpStones} Hero XP Stones, +${r.rewards.xp} XP` : "No rewards — try again.");
        } }, "Fight") ,
      ]),
      AV.el("div", { class: "panel" }, [
        AV.el("h3", {}, "Jump to a cleared level"),
        AV.el("div", { class: "hd-actions" }, Array.from({ length: Math.min(cleared, 10) }, (_, i) => cleared - i).map((lvl) =>
          AV.el("button", { class: "btn btn-small", onclick: () => {
            const r = AV.fightCampaignLevel(lvl);
            if (r.error) { AV.toast(r.error, true); return; }
            AV.rerender();
            AV.showBattleResult(r, r.rewards ? `+${r.rewards.gold} gold` : "No rewards.");
          } }, `Lv.${lvl}`)
        )),
      ]),
    ]));
  };
})(window.AV);
