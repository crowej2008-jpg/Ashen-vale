/* ==========================================================================
   src/ui/screens/summon.js
   Hero gacha (Summoning Scrolls), Artifact gacha (Artifact Summoning
   Stones), the gold shop for hero copies, and the Arena Shop page selling
   Summoning Scrolls / Artifact Summoning Stones for Arena Tokens.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  function resultCard(title, tpl) {
    return AV.el("div", { class: "summon-result", style: `--grade-color:${AV.GRADE_COLORS[tpl.grade]}` }, [
      AV.el("div", { class: "hero-card-grade" }, `★${tpl.grade}`),
      AV.el("div", { class: "hero-card-portrait" }, AV.CLASS_ICONS[tpl.class] || "◆"),
      AV.el("div", { class: "hero-card-name" }, title),
    ]);
  }

  AV.screens.summon = function summonScreen(container) {
    const resultsHost = AV.el("div", { class: "summon-results" });

    const heroPanel = AV.el("div", { class: "panel" }, [
      AV.el("h3", {}, "Hero Summon"),
      AV.el("div", { class: "empty-note" }, `Have ${AV.state.currencies.summoningScrolls} Summoning Scrolls.`),
      AV.el("div", { class: "hd-actions" }, [
        AV.el("button", { class: "btn", onclick: () => doSummon(1) }, "Summon x1"),
        AV.el("button", { class: "btn", onclick: () => doSummon(10) }, "Summon x10"),
      ]),
    ]);

    function doSummon(n) {
      resultsHost.innerHTML = "";
      let any = false;
      for (let i = 0; i < n; i++) {
        const r = AV.summonHero();
        if (r.error) { AV.toast(r.error, true); break; }
        any = true;
        resultsHost.appendChild(resultCard(r.template.name, r.template));
      }
      if (any) AV.toast("Summon complete.");
      AV.rerender();
    }

    const artifactPanel = AV.el("div", { class: "panel" }, [
      AV.el("h3", {}, "Artifact Summon"),
      AV.el("div", { class: "empty-note" }, `Have ${AV.state.currencies.artifactStones} Artifact Summoning Stones.`),
      AV.el("div", { class: "hd-actions" }, [
        AV.el("button", { class: "btn", onclick: () => doArtifactSummon() }, "Summon Artifact"),
      ]),
    ]);

    function doArtifactSummon() {
      const r = AV.summonArtifact();
      if (r.error) { AV.toast(r.error, true); return; }
      AV.toast(`Obtained ${r.template.name}!`);
      AV.rerender();
    }

    const shopPanel = AV.el("div", { class: "panel" }, [
      AV.el("h3", {}, "Arena Shop"),
      AV.el("div", { class: "empty-note" }, `Have ${AV.state.currencies.arenaTokens} Arena Tokens.`),
      AV.el("div", { class: "hd-actions" }, [
        AV.el("button", { class: "btn", onclick: () => { const r = AV.buyScrollsWithTokens(1, 15); r.error ? AV.toast(r.error, true) : AV.toast("Bought 1 Summoning Scroll."); AV.rerender(); } }, "Buy 1 Scroll (15 🎖)"),
        AV.el("button", { class: "btn", onclick: () => { const r = AV.buyArtifactStonesWithTokens(1, 40); r.error ? AV.toast(r.error, true) : AV.toast("Bought 1 Artifact Stone."); AV.rerender(); } }, "Buy 1 Artifact Stone (40 🎖)"),
        AV.el("button", { class: "btn", onclick: () => { const r = AV.dev.addCurrency("heroXpStones", 20); AV.toast("Bought 20 Hero XP Stones."); AV.rerender(); } }, "Buy 20 Hero XP Stones"),
      ]),
    ]);

    const goldShopPanel = AV.el("div", { class: "panel" }, [
      AV.el("h3", {}, "Gold Shop — Hero Copies"),
      AV.el("div", { class: "empty-note" }, "Buy a specific copy of a hero you already own (or a new one) with gold — useful fodder for evolution."),
      AV.el("div", { class: "gold-shop-list" }, AV.HERO_TEMPLATES.slice(0, 12).map((tpl) =>
        AV.el("div", { class: "armor-owned-item" }, [
          AV.el("span", {}, `${tpl.name} (Grade ${tpl.grade}) — ${AV.fmt(tpl.grade * 8000)} gold`),
          AV.el("button", { class: "btn btn-small", onclick: () => {
            const r = AV.buyHeroCopyWithGold(tpl.id);
            r.error ? AV.toast(r.error, true) : AV.toast(`Bought ${tpl.name}.`);
            AV.rerender();
          } }, "Buy"),
        ])
      )),
    ]);

    container.appendChild(AV.el("div", { class: "screen" }, [
      AV.el("h1", {}, "Summon"),
      AV.el("div", { class: "home-grid" }, [heroPanel, artifactPanel, shopPanel]),
      resultsHost,
      goldShopPanel,
    ]));
  };
})(window.AV);
