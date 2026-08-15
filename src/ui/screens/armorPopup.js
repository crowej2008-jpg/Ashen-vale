/* ==========================================================================
   src/ui/screens/armorPopup.js — armor equip popup within Hero Details.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.openArmorPopup = function openArmorPopup(instanceId, onChange) {
    const build = () => {
      const inst = AV.state.heroInstances[instanceId];
      const tpl = AV.template(inst.templateId);
      const wrap = AV.el("div", { class: "popup-box" });
      wrap.appendChild(AV.el("h3", {}, `Armor — ${tpl.name}`));

      const slots = AV.el("div", { class: "armor-slots" });
      AV.ARMOR_PIECES.forEach((piece, idx) => {
        const armorId = inst.equippedArmor[idx];
        const armor = armorId ? AV.state.armorInventory[armorId] : null;
        const setDef = armor ? AV.ARMOR_SETS.find((s) => s.key === armor.setKey) : null;
        slots.appendChild(AV.el("div", { class: "armor-slot" }, [
          AV.el("div", { class: "armor-slot-label" }, piece.charAt(0).toUpperCase() + piece.slice(1)),
          armor
            ? AV.el("div", { class: "armor-equipped" }, [
                AV.el("div", {}, `${setDef.name} (${armor.rarity})${setDef.theme === tpl.class ? " ⚡ matched" : ""}`),
                AV.el("button", { class: "btn btn-small", onclick: () => { AV.unequipArmor(instanceId, idx); refresh(); } }, "Unequip"),
              ])
            : AV.el("div", { class: "armor-empty" }, "Empty"),
        ]));
      });
      wrap.appendChild(slots);

      wrap.appendChild(AV.el("h4", {}, "Owned Armor (unequipped)"));
      const owned = Object.values(AV.state.armorInventory).filter((a) => !a.equippedOn);
      if (!owned.length) {
        wrap.appendChild(AV.el("div", { class: "empty-note" }, "No spare armor. Run the Armor Dungeon to find pieces."));
      } else {
        const list = AV.el("div", { class: "armor-owned-list" });
        owned.forEach((a) => {
          const setDef = AV.ARMOR_SETS.find((s) => s.key === a.setKey);
          list.appendChild(AV.el("div", { class: "armor-owned-item" }, [
            AV.el("span", {}, `${setDef.name} ${a.piece} · ${a.rarity}${setDef.theme === tpl.class ? " ⚡" : ""}`),
            AV.el("button", { class: "btn btn-small", onclick: () => { AV.equipArmor(a.id, instanceId); refresh(); } }, "Equip"),
            AV.el("button", { class: "btn btn-small btn-danger", onclick: () => { AV.disassembleArmor(a.id); refresh(); } }, "Disassemble"),
          ]));
        });
        wrap.appendChild(list);
      }

      wrap.appendChild(AV.el("div", { class: "empty-note" }, `Full matching set: +1000 HP / +500 ATK / +50 SPD / +750 DEF — doubled if the set's theme matches this hero's class (${tpl.class}).`));
      return wrap;
    };

    let close = null;
    let firstOpen = true;
    function refresh() {
      if (close) close();
      close = AV.openModal(build(), { onClose: () => { close = null; } });
      // Skip notifying the parent on the very first open so Hero Details
      // doesn't re-stack itself on top of this popup right after opening it.
      if (!firstOpen) onChange && onChange();
      firstOpen = false;
    }
    refresh();
  };
})(window.AV);
