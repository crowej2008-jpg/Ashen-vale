/* ==========================================================================
   src/ui/screens/awakeningHallScreen.js
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.screens.awakening = function awakeningScreen(container) {
    const unlocked = AV.isAwakeningHallUnlocked();
    const heroes = Object.values(AV.state.heroInstances).sort((a, b) => b.awakeningTier - a.awakeningTier);

    container.appendChild(AV.el("div", { class: "screen" }, [
      AV.el("h1", {}, "Awakening Hall"),
      !unlocked
        ? AV.el("div", { class: "empty-note" }, `Locked. Unlocks at player level ${AV.AWAKENING_UNLOCK_PLAYER_LEVEL} (currently ${AV.state.player.level}).`)
        : AV.el("div", { class: "empty-note" }, `Radiant Crystals: ${AV.state.currencies.radiantCrystals}. Tiers run E- → SSS (10 tiers).`),
      AV.el("div", { class: "hero-grid" }, heroes.map((h) => {
        const tpl = AV.template(h.templateId);
        const tierLabel = h.awakeningTier >= 0 ? AV.AWAKENING_TIERS[h.awakeningTier] : "Unawakened";
        const cost = AV.awakeningCrystalCost(h.awakeningTier);
        const maxed = h.awakeningTier >= AV.AWAKENING_TIERS.length - 1;
        return AV.el("div", { class: "hero-card small", style: `--grade-color:${AV.GRADE_COLORS[tpl.grade]}` }, [
          AV.el("div", { class: "hero-card-grade" }, `★${tpl.grade}`),
          AV.el("div", { class: "hero-card-portrait" }, AV.CLASS_ICONS[tpl.class]),
          AV.el("div", { class: "hero-card-name" }, tpl.name),
          AV.el("div", { class: "hero-card-sub" }, `Tier: ${tierLabel}`),
          maxed
            ? AV.el("div", { class: "empty-note" }, "Max tier (SSS)")
            : AV.el("button", { class: "btn btn-small", disabled: unlocked ? undefined : "true", onclick: () => {
                const r = AV.awakenHero(h.id);
                r.error ? AV.toast(r.error, true) : AV.toast(`Awakened to ${r.newTier}!`);
                AV.rerender();
              } }, `Awaken (${cost} 💎)`),
        ]);
      })),
    ]));
  };
})(window.AV);
