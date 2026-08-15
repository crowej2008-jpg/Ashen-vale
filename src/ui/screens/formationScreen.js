/* ==========================================================================
   src/ui/screens/formationScreen.js
   Place, move, and swap heroes between the 6 formation slots. Shows the
   live class-stacking bonus (up to +20% attack/health for 6-of-a-kind).
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  let sortMode = "rarity";
  let selectedSlot = null;

  AV.screens.formation = function formationScreen(container) {
    const classBonus = AV.computeFormationClassBonus();

    const slots = AV.el("div", { class: "formation-slots" }, AV.state.formation.map((instId, idx) => {
      const inst = instId ? AV.state.heroInstances[instId] : null;
      const tpl = inst ? AV.template(inst.templateId) : null;
      const bonus = inst ? classBonus[inst.id] : null;
      return AV.el("div", {
        class: `formation-slot ${selectedSlot === idx ? "targeting" : ""}`,
        onclick: () => { selectedSlot = idx; AV.rerender(); },
      }, inst ? [
        AV.el("div", { class: "formation-hero", style: `--grade-color:${AV.GRADE_COLORS[tpl.grade]}` }, [
          AV.el("div", { class: "hero-card-portrait" }, AV.CLASS_ICONS[tpl.class]),
          AV.el("div", {}, tpl.name),
          AV.el("div", { class: "empty-note" }, `CP ${AV.fmt(AV.computeCP(inst))}`),
          bonus && bonus.count > 1 ? AV.el("div", { class: "class-bonus-tag" }, `+${Math.round(bonus.attackPct * 100)}% class bonus (${bonus.count}× ${tpl.class})`) : null,
          AV.el("button", { class: "btn btn-small btn-danger", onclick: (e) => { e.stopPropagation(); AV.clearFormationSlot(idx); AV.rerender(); } }, "Remove"),
        ]),
      ] : [AV.el("div", { class: "empty-note" }, "Empty slot — tap to fill")]);
    }));

    const owned = Object.values(AV.state.heroInstances).sort((a, b) => {
      if (sortMode === "cp") return AV.computeCP(b) - AV.computeCP(a);
      return AV.template(b.templateId).grade - AV.template(a.templateId).grade;
    });

    const picker = AV.el("div", { class: "hero-grid" }, owned.map((h) =>
      AV.renderHeroCard(h, {
        selected: selectedSlot != null && AV.state.formation[selectedSlot] === h.id,
        onClick: (inst) => {
          if (selectedSlot == null) { AV.toast("Tap a formation slot first."); return; }
          AV.setFormationSlot(selectedSlot, inst.id);
          selectedSlot = null;
          AV.rerender();
        },
      })
    ));

    container.appendChild(AV.el("div", { class: "screen" }, [
      AV.el("h1", {}, "Formation"),
      AV.el("div", { class: "empty-note" }, "Same-class stacking grants +attack%/health%, up to 20% for a full 6-of-a-kind formation."),
      slots,
      AV.el("div", { class: "screen-header" }, [
        AV.el("h2", {}, "Your Heroes"),
        AV.el("select", { onchange: (e) => { sortMode = e.target.value; AV.rerender(); } }, [
          AV.el("option", { value: "rarity" }, "Highest Rarity"),
          AV.el("option", { value: "cp" }, "Highest CP"),
        ]),
      ]),
      owned.length ? picker : AV.el("div", { class: "empty-note" }, "No heroes yet. Visit Summon."),
    ]));
  };
})(window.AV);
