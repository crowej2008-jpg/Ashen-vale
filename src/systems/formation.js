/* ==========================================================================
   src/systems/formation.js
   Formation: 6 slots, freely placed/moved/swapped. Having multiple heroes
   of the same class in the active formation grants stacking attack%/health%,
   scaling to 20% for a full 6-of-a-kind formation (i.e. ~4% per matching
   member beyond the first, capped at 20%).
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.setFormationSlot = function setFormationSlot(slotIndex, instanceId) {
    const f = AV.state.formation;
    // If this hero is already elsewhere in formation, swap positions.
    const existingIdx = f.indexOf(instanceId);
    if (instanceId && existingIdx !== -1 && existingIdx !== slotIndex) {
      const tmp = f[slotIndex];
      f[slotIndex] = instanceId;
      f[existingIdx] = tmp;
    } else {
      f[slotIndex] = instanceId;
    }
    AV.save();
  };

  AV.clearFormationSlot = function clearFormationSlot(slotIndex) {
    AV.state.formation[slotIndex] = null;
    AV.save();
  };

  AV.formationHeroes = function formationHeroes() {
    return AV.state.formation
      .map((id) => (id ? AV.state.heroInstances[id] : null))
      .filter(Boolean);
  };

  /** Returns { [instanceId]: { attackPct, hpPct, count } } for the class-bonus. */
  AV.computeFormationClassBonus = function computeFormationClassBonus() {
    const heroes = AV.formationHeroes();
    const byClass = {};
    heroes.forEach((h) => {
      const cls = AV.template(h.templateId).class;
      byClass[cls] = (byClass[cls] || []).concat(h.id);
    });
    const result = {};
    Object.values(byClass).forEach((ids) => {
      const count = ids.length;
      // 1 hero = 0%, 6 heroes = 20% -> 4% per additional matching member
      const bonusPct = Math.min(0.2, Math.max(0, (count - 1) * 0.04));
      ids.forEach((id) => {
        result[id] = { attackPct: bonusPct, hpPct: bonusPct, count };
      });
    });
    return result;
  };
})(window.AV);
