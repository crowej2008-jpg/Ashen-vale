/* ==========================================================================
   src/ui/screens/orbShopScreen.js
   Sells a rotating selection of orbs, refreshing every 15 minutes.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  let tickHandle = null;

  AV.screens.orbShop = function orbShopScreen(container) {
    AV.refreshOrbShopIfNeeded();

    const screen = AV.el("div", { class: "screen" }, [
      AV.el("h1", {}, "Orb Shop"),
      AV.el("div", { class: "empty-note", id: "orb-shop-timer" }, timerText()),
      AV.el("div", { class: "hero-grid", id: "orb-shop-grid" }, AV.state.orbShop.stock.map(orbStockCard)),
      AV.el("h2", {}, "Owned Orbs"),
      ownedOrbsList(),
    ]);
    container.appendChild(screen);

    if (tickHandle) clearInterval(tickHandle);
    tickHandle = setInterval(() => {
      const remaining = AV.orbShopTimeRemainingMs();
      const timerEl = document.getElementById("orb-shop-timer");
      if (!timerEl) { clearInterval(tickHandle); return; }
      if (remaining <= 0) { AV.rerender(); return; }
      timerEl.textContent = timerText();
    }, 1000);
  };

  function timerText() {
    const ms = AV.orbShopTimeRemainingMs();
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `Stock refreshes in ${mins}m ${secs.toString().padStart(2, "0")}s`;
  }

  function orbStockCard(item) {
    const set = AV.ALL_ORB_SETS.find((s) => s.key === item.setKey);
    return AV.el("div", { class: `hero-card small rarity-${item.rarity}` }, [
      AV.el("div", { class: "hero-card-name" }, item.name),
      AV.el("div", { class: "hero-card-sub" }, `${set ? set.name : ""} · ${AV.ORB_RARITY_LABEL[item.rarity]}`),
      AV.el("div", { class: "hero-card-cp" }, `${AV.fmt(item.price)} 🪙`),
      AV.el("button", { class: "btn btn-small", onclick: () => {
        const r = AV.buyOrbFromShop(item.stockId);
        r.error ? AV.toast(r.error, true) : AV.toast(`Bought ${item.name}.`);
        AV.rerender();
      } }, "Buy"),
    ]);
  }

  function ownedOrbsList() {
    const owned = Object.values(AV.state.orbInventory);
    if (!owned.length) return AV.el("div", { class: "empty-note" }, "No orbs yet — buy some above, then equip via a hero's details popup.");
    return AV.el("div", { class: "armor-owned-list" }, owned.map((o) => {
      const set = AV.ALL_ORB_SETS.find((s) => s.key === o.setKey);
      const heroName = o.equippedOn ? AV.template(AV.state.heroInstances[o.equippedOn].templateId).name : null;
      return AV.el("div", { class: "armor-owned-item" }, [
        AV.el("span", {}, `${set ? set.name : "Orb"} · ${AV.ORB_RARITY_LABEL[o.rarity]} · Lv.${o.level}${heroName ? ` · on ${heroName}` : ""}`),
      ]);
    }));
  }
})(window.AV);
