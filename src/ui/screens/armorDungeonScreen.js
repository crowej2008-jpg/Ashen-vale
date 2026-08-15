/* ==========================================================================
   src/ui/screens/armorDungeonScreen.js — special dungeon that drops armor.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.screens.armorDungeon = function armorDungeonScreen(container) {
    const owned = Object.values(AV.state.armorInventory);
    container.appendChild(AV.el("div", { class: "screen" }, [
      AV.el("h1", {}, "Armor Dungeon"),
      AV.el("div", { class: "empty-note" }, "Clear a run to find a random armor piece from one of the 6 named sets."),
      AV.el("div", { class: "panel" }, [
        AV.el("button", { class: "btn", onclick: () => {
          const piece = AV.runArmorDungeon();
          const setDef = AV.ARMOR_SETS.find((s) => s.key === piece.setKey);
          AV.toast(`Found ${setDef.name} ${piece.piece} (${piece.rarity})!`);
          AV.rerender();
        } }, "Run Dungeon"),
      ]),
      AV.el("h2", {}, `Owned Armor (${owned.length})`),
      owned.length ? AV.el("div", { class: "armor-owned-list" }, owned.map((a) => {
        const setDef = AV.ARMOR_SETS.find((s) => s.key === a.setKey);
        const heroName = a.equippedOn ? AV.template(AV.state.heroInstances[a.equippedOn].templateId).name : null;
        return AV.el("div", { class: "armor-owned-item" }, [
          AV.el("span", {}, `${setDef.name} ${a.piece} · ${a.rarity} · themed to ${setDef.theme}${heroName ? ` · equipped on ${heroName}` : ""}`),
          !a.equippedOn ? AV.el("button", { class: "btn btn-small btn-danger", onclick: () => { AV.disassembleArmor(a.id); AV.rerender(); } }, "Disassemble") : null,
        ]);
      })) : AV.el("div", { class: "empty-note" }, "No armor yet."),
    ]));
  };
})(window.AV);
