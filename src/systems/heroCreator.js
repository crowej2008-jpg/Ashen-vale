/* ==========================================================================
   src/systems/heroCreator.js
   Hero Creator: sacrifice 3 grade-3 heroes to forge a random grade-4 hero,
   or 3 grade-4 heroes to forge a random grade-5 hero.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.eligibleForForge = function eligibleForForge(grade) {
    return Object.values(AV.state.heroInstances).filter((h) => {
      if (AV.state.formation.includes(h.id)) return false;
      const tpl = AV.template(h.templateId);
      return tpl.grade === grade;
    });
  };

  AV.forgeHero = function forgeHero(sourceGrade, instanceIds) {
    if (sourceGrade !== 3 && sourceGrade !== 4) return { error: "Forging requires grade-3 or grade-4 heroes." };
    if (instanceIds.length !== 3) return { error: "Select exactly 3 heroes to sacrifice." };
    const insts = instanceIds.map((id) => AV.state.heroInstances[id]);
    if (insts.some((h) => !h)) return { error: "Invalid hero selection." };
    if (insts.some((h) => AV.state.formation.includes(h.id))) return { error: "Remove selected heroes from the formation first." };
    if (insts.some((h) => AV.template(h.templateId).grade !== sourceGrade)) {
      return { error: `All 3 sacrificed heroes must be grade ${sourceGrade}.` };
    }

    const resultGrade = sourceGrade + 1;
    const pool = AV.HERO_TEMPLATES.filter((h) => h.grade === resultGrade);
    const tpl = pool[AV.randInt(0, pool.length - 1)];

    instanceIds.forEach((id) => delete AV.state.heroInstances[id]);
    const inst = AV.grantHero(tpl.id);
    AV.save();
    return { ok: true, instance: inst, template: tpl };
  };
})(window.AV);
