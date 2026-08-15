/* ==========================================================================
   src/ui/screens/orbPopup.js — orb equip/level popup (8 slots per hero).
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  function orbLabel(orb) {
    const set = AV.ALL_ORB_SETS.find((s) => s.key === orb.setKey);
    return `${set ? set.name : "Orb"} · ${AV.ORB_RARITY_LABEL[orb.rarity]} · Lv.${orb.level}`;
  }

  AV.openOrbPopup = function openOrbPopup(instanceId, onChange) {
    const build = () => {
      const inst = AV.state.heroInstances[instanceId];
      const tpl = AV.template(inst.templateId);
      const wrap = AV.el("div", { class: "popup-box" });
      wrap.appendChild(AV.el("h3", {}, `Orbs — ${tpl.name} (${inst.orbIds.filter(Boolean).length}/${AV.ORB_SLOTS_PER_HERO})`));

      const grid = AV.el("div", { class: "orb-grid" });
      inst.orbIds.forEach((orbId, slotIdx) => {
        const orb = orbId ? AV.state.orbInventory[orbId] : null;
        grid.appendChild(AV.el("div", { class: `orb-slot rarity-${orb ? orb.rarity : "empty"}` }, [
          AV.el("div", { class: "orb-slot-title" }, `Slot ${slotIdx + 1}`),
          orb
            ? AV.el("div", {}, [
                AV.el("div", { class: "orb-name" }, orbLabel(orb)),
                AV.el("button", { class: "btn btn-small", onclick: () => { AV.unequipOrb(instanceId, slotIdx); refresh(); } }, "Unequip"),
                orb.level < AV.ORB_MAX_LEVEL
                  ? AV.el("button", { class: "btn btn-small", onclick: () => { const r = AV.levelUpOrb(orbId); if (r.error) AV.toast(r.error, true); refresh(); } }, `Lv Up (${AV.orbFodder(orbId).length}/${AV.ORB_COPIES_PER_LEVEL})`)
                  : null,
              ])
            : AV.el("div", { class: "empty-note" }, "Empty"),
        ]));
      });
      wrap.appendChild(grid);

      wrap.appendChild(AV.el("h4", {}, "Owned Orbs (unequipped)"));
      const owned = Object.values(AV.state.orbInventory).filter((o) => !o.equippedOn);
      if (!owned.length) {
        wrap.appendChild(AV.el("div", { class: "empty-note" }, "None. Buy orbs from the Orb Shop."));
      } else {
        const list = AV.el("div", { class: "armor-owned-list" });
        owned.forEach((o) => {
          const emptySlot = inst.orbIds.indexOf(null);
          list.appendChild(AV.el("div", { class: "armor-owned-item" }, [
            AV.el("span", {}, orbLabel(o)),
            AV.el("button", {
              class: "btn btn-small", disabled: emptySlot === -1 ? "true" : undefined,
              onclick: () => { AV.equipOrb(o.id, instanceId, emptySlot); refresh(); },
            }, "Equip"),
          ]));
        });
        wrap.appendChild(list);
      }

      wrap.appendChild(AV.el("div", { class: "empty-note" }, "Omega sets need 3 distinct orbs equipped, Prime sets need 5. Set bonuses unlock as combined equipped-orb levels reach 3/5/7/10."));
      return wrap;
    };

    let close = null;
    let firstOpen = true;
    function refresh() {
      if (close) close();
      close = AV.openModal(build(), { wide: true, onClose: () => { close = null; } });
      // Notify the parent (Hero Details) to refresh its own background/data,
      // but skip on the very first open — otherwise the parent modal would
      // re-stack itself on top of this popup immediately after opening it.
      if (!firstOpen) onChange && onChange();
      firstOpen = false;
    }
    refresh();
  };
})(window.AV);
