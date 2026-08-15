/* ==========================================================================
   src/ui/screens/roster.js
   Shows every owned copy of every hero as its own card (cap 1000 total).
   Sort by rarity (default) or CP. Heroes currently in the formation are
   pinned to the top — but only ONE card per placed hero; extra copies of
   that same hero stay in their normal sorted position. Toggleable.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  let sortMode = "rarity"; // "rarity" | "cp"

  AV.screens.roster = function rosterScreen(container) {
    const all = Object.values(AV.state.heroInstances);
    const sorted = [...all].sort((a, b) => {
      if (sortMode === "cp") return AV.computeCP(b) - AV.computeCP(a);
      const ga = AV.template(a.templateId).grade, gb = AV.template(b.templateId).grade;
      if (gb !== ga) return gb - ga;
      return AV.computeCP(b) - AV.computeCP(a);
    });

    let ordered = sorted;
    if (AV.state.settings.rosterPinFormation) {
      const pinnedIds = new Set(AV.state.formation.filter(Boolean));
      const pinned = [];
      const rest = [];
      const seenPinned = new Set();
      sorted.forEach((h) => {
        if (pinnedIds.has(h.id) && !seenPinned.has(h.id)) {
          pinned.push(h);
          seenPinned.add(h.id);
        } else {
          rest.push(h);
        }
      });
      ordered = [...pinned, ...rest];
    }

    const grid = AV.el("div", { class: "hero-grid" }, ordered.map((h) =>
      AV.renderHeroCard(h, { onClick: (inst) => AV.openHeroDetails(inst.id) })
    ));

    container.appendChild(AV.el("div", { class: "screen" }, [
      AV.el("div", { class: "screen-header" }, [
        AV.el("h1", {}, `Roster (${all.length}/${AV.ROSTER_CAP})`),
        AV.el("div", { class: "toolbar" }, [
          AV.el("label", {}, ["Sort: ",
            AV.el("select", {
              onchange: (e) => { sortMode = e.target.value; AV.rerender(); },
            }, [
              AV.el("option", { value: "rarity", selected: sortMode === "rarity" ? "true" : undefined }, "Highest Rarity"),
              AV.el("option", { value: "cp", selected: sortMode === "cp" ? "true" : undefined }, "Highest CP"),
            ]),
          ]),
          AV.el("label", { class: "toggle-label" }, [
            AV.el("input", {
              type: "checkbox", checked: AV.state.settings.rosterPinFormation ? "true" : undefined,
              onchange: (e) => { AV.state.settings.rosterPinFormation = e.target.checked; AV.save(); AV.rerender(); },
            }),
            " Pin formation heroes to top",
          ]),
        ]),
      ]),
      all.length ? grid : AV.el("div", { class: "empty-note" }, "No heroes yet. Visit Summon."),
    ]));
  };
})(window.AV);
