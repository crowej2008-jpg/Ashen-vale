/* ==========================================================================
   src/ui/screens/artifactPopup.js — artifact equip/upgrade popup.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.openArtifactPopup = function openArtifactPopup(instanceId, onChange) {
    const build = () => {
      const inst = AV.state.heroInstances[instanceId];
      const tpl = AV.template(inst.templateId);
      const wrap = AV.el("div", { class: "popup-box" });
      wrap.appendChild(AV.el("h3", {}, `Artifact — ${tpl.name}`));

      if (inst.artifactId) {
        const art = AV.state.artifactInventory[inst.artifactId];
        const artTpl = AV.ARTIFACT_TEMPLATES.find((t) => t.key === art.templateKey);
        const fodder = AV.artifactFodder(inst.artifactId).length;
        wrap.appendChild(AV.el("div", { class: "artifact-equipped" }, [
          AV.el("div", {}, `${artTpl.name} — ${"★".repeat(art.stars)}${"☆".repeat(artTpl.maxStars - art.stars)}`),
          AV.el("div", { class: "empty-note" }, artTpl.effect),
          AV.el("div", { class: "hd-actions" }, [
            AV.el("button", { class: "btn btn-small", onclick: () => { AV.unequipArtifact(instanceId); refresh(); } }, "Unequip"),
            art.stars < artTpl.maxStars
              ? AV.el("button", { class: "btn btn-small", onclick: () => { AV.upgradeArtifact(inst.artifactId); refresh(); } }, `Upgrade (need ${artTpl.copiesPerStar} copy, have ${fodder})`)
              : AV.el("span", {}, "Max stars"),
          ]),
        ]));
      } else {
        wrap.appendChild(AV.el("div", { class: "empty-note" }, "No artifact equipped."));
      }

      wrap.appendChild(AV.el("h4", {}, "Owned Artifacts (unequipped)"));
      const owned = Object.values(AV.state.artifactInventory).filter((a) => !a.equippedOn);
      if (!owned.length) {
        wrap.appendChild(AV.el("div", { class: "empty-note" }, "None. Pull from the Artifact gacha in the Summon screen."));
      } else {
        const list = AV.el("div", { class: "armor-owned-list" });
        owned.forEach((a) => {
          const artTpl = AV.ARTIFACT_TEMPLATES.find((t) => t.key === a.templateKey);
          list.appendChild(AV.el("div", { class: "armor-owned-item" }, [
            AV.el("span", {}, `${artTpl.name} · Grade ${artTpl.grade} · ${a.stars}★`),
            AV.el("button", { class: "btn btn-small", onclick: () => { AV.equipArtifact(a.id, instanceId); refresh(); } }, "Equip"),
          ]));
        });
        wrap.appendChild(list);
      }
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
