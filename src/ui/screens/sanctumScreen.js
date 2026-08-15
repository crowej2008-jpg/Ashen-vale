/* ==========================================================================
   src/ui/screens/sanctumScreen.js
   Houses the Soul Statue (global flat stats from Hero Souls) and the
   Legendary-armor soul upgrade path (Armor Souls, from the Disassembly
   Machine — heroes/armor are disassembled from Roster / Armor Dungeon).
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.screens.sanctum = function sanctumScreen(container) {
    const cost = AV.nextSoulStatueCost();
    const bonus = AV.soulStatueBonus();
    const legendaries = Object.values(AV.state.armorInventory).filter((a) => a.rarity === "Legendary");

    container.appendChild(AV.el("div", { class: "screen" }, [
      AV.el("h1", {}, "Sanctum"),

      AV.el("div", { class: "panel" }, [
        AV.el("h3", {}, `Soul Statue — Level ${AV.state.soulStatueLevel}`),
        AV.el("div", { class: "empty-note" }, `Current global bonus: +${bonus.hp} HP / +${bonus.attack} ATK / +${bonus.defense} DEF to every hero.`),
        AV.el("div", {}, `Hero Souls: ${[1, 2, 3, 4, 5].map((g) => `G${g}: ${AV.state.heroSouls[g] || 0}`).join(" · ")}`),
        AV.el("div", {}, `Next upgrade cost: ${Object.entries(cost).map(([g, n]) => `${n}×G${g}`).join(", ")}`),
        AV.el("button", { class: "btn", disabled: AV.canAffordSoulStatueUpgrade() ? undefined : "true", onclick: () => {
          const r = AV.upgradeSoulStatue();
          r.error ? AV.toast(r.error, true) : AV.toast(`Soul Statue upgraded to level ${r.newLevel}!`);
          AV.rerender();
        } }, "Upgrade Statue"),
        AV.el("div", { class: "empty-note" }, "Disassemble spare heroes from any hero's details popup to earn Hero Souls (graded to match the disassembled hero)."),
      ]),

      AV.el("div", { class: "panel" }, [
        AV.el("h3", {}, "Legendary Armor Upgrades"),
        AV.el("div", {}, `Armor Souls: ${AV.state.armorSouls}`),
        legendaries.length
          ? AV.el("div", { class: "armor-owned-list" }, legendaries.map((a) => {
              const setDef = AV.ARMOR_SETS.find((s) => s.key === a.setKey);
              const cost2 = 5 + a.soulUpgrades * 3;
              return AV.el("div", { class: "armor-owned-item" }, [
                AV.el("span", {}, `${setDef.name} ${a.piece} — Soul Lv.${a.soulUpgrades} (next: ${cost2} souls)`),
                AV.el("button", { class: "btn btn-small", onclick: () => {
                  const r = AV.upgradeLegendaryArmorWithSouls(a.id);
                  r.error ? AV.toast(r.error, true) : AV.toast(`Upgraded to soul level ${r.level}.`);
                  AV.rerender();
                } }, "Upgrade"),
              ]);
            }))
          : AV.el("div", { class: "empty-note" }, "No Legendary armor owned yet."),
      ]),
    ]));
  };
})(window.AV);
