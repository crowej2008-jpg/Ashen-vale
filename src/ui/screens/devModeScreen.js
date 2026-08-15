/* ==========================================================================
   src/ui/screens/devModeScreen.js
   Developer tools: currency/resource cheats, hero unlocking & stat-maxing,
   guaranteed loot, progress skips, raw save-state viewer, reset-everything.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.screens.devMode = function devModeScreen(container) {
    const heroes = Object.values(AV.state.heroInstances);

    const currencyRows = Object.keys(AV.state.currencies).map((key) =>
      AV.el("div", { class: "armor-owned-item" }, [
        AV.el("span", {}, `${key}: ${AV.fmt(AV.state.currencies[key])}`),
        AV.el("button", { class: "btn btn-small", onclick: () => { AV.dev.addCurrency(key, 1000); AV.rerender(); } }, "+1000"),
        AV.el("button", { class: "btn btn-small", onclick: () => { AV.dev.addCurrency(key, 100000); AV.rerender(); } }, "+100000"),
      ])
    );

    const rawState = AV.el("textarea", { class: "raw-state", readonly: "true" }, AV.dev.rawState());

    container.appendChild(AV.el("div", { class: "screen" }, [
      AV.el("h1", {}, "Dev Mode"),
      AV.el("div", { class: "empty-note" }, "Testing tools only — not part of the normal game loop."),

      AV.el("div", { class: "panel" }, [
        AV.el("h3", {}, "One-Click Cheats"),
        AV.el("div", { class: "hd-actions" }, [
          AV.el("button", { class: "btn", onclick: () => { AV.dev.guaranteedLoot(); AV.toast("Loaded up on everything."); AV.rerender(); } }, "Guaranteed Loot"),
          AV.el("button", { class: "btn", onclick: () => { AV.dev.unlockAllHeroes(); AV.toast("Unlocked all 40 heroes."); AV.rerender(); } }, "Unlock All Heroes"),
          AV.el("button", { class: "btn", onclick: () => { AV.dev.skipCampaignTo(AV.CAMPAIGN_MAX_LEVEL); AV.toast("Campaign maxed."); AV.rerender(); } }, "Max Campaign"),
          AV.el("button", { class: "btn", onclick: () => { AV.dev.setPlayerLevel(AV.PLAYER_LEVEL_CAP); AV.toast("Player level maxed."); AV.rerender(); } }, "Max Player Level"),
          AV.el("button", { class: "btn", onclick: () => { AV.dev.setElo(2000); AV.toast("Elo set to 2000."); AV.rerender(); } }, "Set Elo 2000"),
        ]),
      ]),

      AV.el("div", { class: "panel" }, [
        AV.el("h3", {}, "Currency Cheats"),
        AV.el("div", { class: "armor-owned-list" }, currencyRows),
      ]),

      AV.el("div", { class: "panel" }, [
        AV.el("h3", {}, "Hero Stat-Maxing"),
        AV.el("div", { class: "hero-grid" }, heroes.map((h) => {
          const tpl = AV.template(h.templateId);
          return AV.el("div", { class: "hero-card small" }, [
            AV.el("div", { class: "hero-card-name" }, tpl.name),
            AV.el("button", { class: "btn btn-small", onclick: () => { AV.dev.maxStatsHero(h.id); AV.toast(`${tpl.name} maxed.`); AV.rerender(); } }, "Max This Copy"),
          ]);
        })),
      ]),

      AV.el("div", { class: "panel" }, [
        AV.el("h3", {}, "Progress Skips"),
        (() => {
          let campaignInput, playerInput;
          return AV.el("div", { class: "hd-actions" }, [
            campaignInput = AV.el("input", { type: "number", value: AV.state.campaign.highestLevelCleared, min: "0", max: String(AV.CAMPAIGN_MAX_LEVEL) }),
            AV.el("button", { class: "btn btn-small", onclick: () => { AV.dev.skipCampaignTo(Number(campaignInput.value)); AV.rerender(); } }, "Set Campaign Level"),
            playerInput = AV.el("input", { type: "number", value: AV.state.player.level, min: "1", max: String(AV.PLAYER_LEVEL_CAP) }),
            AV.el("button", { class: "btn btn-small", onclick: () => { AV.dev.setPlayerLevel(Number(playerInput.value)); AV.rerender(); } }, "Set Player Level"),
          ]);
        })(),
      ]),

      AV.el("div", { class: "panel" }, [
        AV.el("h3", {}, "Raw Save-State Viewer"),
        rawState,
      ]),

      AV.el("div", { class: "panel" }, [
        AV.el("h3", {}, "Danger Zone"),
        AV.el("button", { class: "btn btn-danger", onclick: () => {
          if (confirm("Reset EVERYTHING? This cannot be undone.")) {
            AV.dev.resetEverything();
            AV.navigate("home");
          }
        } }, "Reset Everything"),
      ]),
    ]));
  };
})(window.AV);
