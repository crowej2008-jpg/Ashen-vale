/* ==========================================================================
   src/ui/screens/heroCreatorScreen.js
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  function forgePanel(container, sourceGrade) {
    let selected = [];
    const pool = AV.eligibleForForge(sourceGrade);
    const grid = AV.el("div", { class: "hero-grid" }, pool.map((h) =>
      AV.renderHeroCard(h, {
        selected: selected.includes(h.id),
        onClick: (inst) => {
          if (selected.includes(inst.id)) selected = selected.filter((id) => id !== inst.id);
          else if (selected.length < 3) selected.push(inst.id);
          rerenderLocal();
        },
      })
    ));
    const panel = AV.el("div", { class: "panel" }, [
      AV.el("h3", {}, `Forge Grade ${sourceGrade} → Grade ${sourceGrade + 1}`),
      AV.el("div", { class: "empty-note" }, `Select 3 grade-${sourceGrade} heroes to sacrifice. Selected: ${selected.length}/3.`),
      AV.el("button", { class: "btn", disabled: selected.length !== 3 ? "true" : undefined, onclick: () => {
        const r = AV.forgeHero(sourceGrade, selected);
        if (r.error) { AV.toast(r.error, true); return; }
        AV.toast(`Forged ${r.template.name}!`);
        selected = [];
        AV.rerender();
      } }, "Forge"),
      pool.length ? grid : AV.el("div", { class: "empty-note" }, `No spare grade-${sourceGrade} heroes.` ),
    ]);
    function rerenderLocal() { AV.rerender(); }
    container.appendChild(panel);
  }

  AV.screens.heroCreator = function heroCreatorScreen(container) {
    const screen = AV.el("div", { class: "screen" }, [
      AV.el("h1", {}, "Hero Creator"),
      AV.el("div", { class: "empty-note" }, "Sacrifice 3 grade-3 heroes to forge a grade-4, or 3 grade-4 heroes to forge a grade-5. Heroes in the active formation can't be sacrificed."),
    ]);
    container.appendChild(screen);
    forgePanel(screen, 3);
    forgePanel(screen, 4);
  };
})(window.AV);
