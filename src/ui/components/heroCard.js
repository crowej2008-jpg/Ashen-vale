/* ==========================================================================
   src/ui/components/heroCard.js
   Every hero card shows grade and CP directly, no need to open details.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.renderHeroCard = function renderHeroCard(instance, opts = {}) {
    const tpl = AV.template(instance.templateId);
    const cp = AV.computeCP(instance);
    const inFormation = AV.state.formation.includes(instance.id);
    const gradeColor = AV.GRADE_COLORS[tpl.grade];

    const card = AV.el("div", {
      class: `hero-card grade-${tpl.grade} ${opts.selected ? "selected" : ""} ${opts.small ? "small" : ""}`,
      style: `--grade-color:${gradeColor}`,
      onclick: () => opts.onClick && opts.onClick(instance),
    }, [
      AV.el("div", { class: "hero-card-grade" }, `★${tpl.grade}`),
      inFormation ? AV.el("div", { class: "hero-card-pin", title: "In formation" }, "◆") : null,
      AV.el("div", { class: "hero-card-portrait" }, AV.CLASS_ICONS[tpl.class] || "?"),
      AV.el("div", { class: "hero-card-name" }, tpl.name),
      AV.el("div", { class: "hero-card-sub" }, `${tpl.class} · Lv.${instance.level} · ${instance.stars}★${instance.ascensionRank ? `+${instance.ascensionRank}` : ""}`),
      AV.el("div", { class: "hero-card-cp" }, `CP ${AV.fmt(cp)}`),
    ]);
    return card;
  };
})(window.AV);
