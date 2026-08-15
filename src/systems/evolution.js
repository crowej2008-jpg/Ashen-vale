/* ==========================================================================
   src/systems/evolution.js
   Evolution: heroes evolve up to 10 stars by consuming EXTRA copies of the
   same hero. The copy currently being viewed/evolved is never itself
   consumed as fodder, so the player always keeps at least 1 copy.

   Ascension: once at 10 stars, a hero can be pushed further ("ranks")
   using more copies of that hero PLUS a sacrificed hero that has reached
   a qualifying star level. Rank 1 requires a 4-star sacrifice; each
   subsequent rank requires +1 star on the sacrifice.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  const COPY_COST_BY_STAR = [1, 1, 2, 2, 3, 3, 4, 4, 5, 6]; // cost to go FROM star (index) TO star(index+1)
  const ASCENSION_COPY_COST = 3;
  const ASCENSION_BASE_SACRIFICE_STAR = 4;

  /** Other owned copies of the same template, excluding the instance being evolved. */
  AV.availableFodder = function availableFodder(instanceId) {
    const inst = AV.state.heroInstances[instanceId];
    if (!inst) return [];
    return Object.values(AV.state.heroInstances).filter(
      (h) => h.templateId === inst.templateId && h.id !== instanceId
    );
  };

  AV.nextEvolutionCost = function nextEvolutionCost(instanceId) {
    const inst = AV.state.heroInstances[instanceId];
    if (!inst || inst.stars >= 10) return null;
    return COPY_COST_BY_STAR[inst.stars];
  };

  AV.evolveHero = function evolveHero(instanceId) {
    const inst = AV.state.heroInstances[instanceId];
    if (!inst) return { error: "Hero not found." };
    if (inst.stars >= 10) return { error: "Already at max evolution (10 stars). Use Ascension instead." };

    const cost = COPY_COST_BY_STAR[inst.stars];
    const fodder = AV.availableFodder(instanceId);
    if (fodder.length < cost) {
      return { error: `Need ${cost} spare cop${cost > 1 ? "ies" : "y"} of this hero to evolve (have ${fodder.length}).` };
    }

    // Consume `cost` fodder copies — never the viewed instance itself.
    fodder.slice(0, cost).forEach((f) => delete AV.state.heroInstances[f.id]);
    inst.stars += 1;
    AV.save();
    return { ok: true, newStars: inst.stars };
  };

  AV.nextAscensionRequirement = function nextAscensionRequirement(instanceId) {
    const inst = AV.state.heroInstances[instanceId];
    if (!inst || inst.stars < 10) return null;
    const requiredSacrificeStar = ASCENSION_BASE_SACRIFICE_STAR + inst.ascensionRank;
    return { copyCost: ASCENSION_COPY_COST, requiredSacrificeStar, rank: inst.ascensionRank + 1 };
  };

  AV.eligibleSacrifices = function eligibleSacrifices(instanceId, requiredStar) {
    const inst = AV.state.heroInstances[instanceId];
    return Object.values(AV.state.heroInstances).filter(
      (h) => h.id !== instanceId && h.stars >= requiredStar
    );
  };

  AV.ascendHero = function ascendHero(instanceId, sacrificeInstanceId) {
    const inst = AV.state.heroInstances[instanceId];
    if (!inst || inst.stars < 10) return { error: "Hero must be 10 stars before ascending." };
    const req = AV.nextAscensionRequirement(instanceId);
    const sac = AV.state.heroInstances[sacrificeInstanceId];
    if (!sac || sac.id === instanceId) return { error: "Invalid sacrifice hero." };
    if (sac.stars < req.requiredSacrificeStar) {
      return { error: `Sacrifice hero must be at least ${req.requiredSacrificeStar} stars.` };
    }
    const fodder = AV.availableFodder(instanceId).filter((f) => f.id !== sacrificeInstanceId);
    if (fodder.length < req.copyCost) {
      return { error: `Need ${req.copyCost} spare copies of this hero to ascend (have ${fodder.length}).` };
    }

    fodder.slice(0, req.copyCost).forEach((f) => delete AV.state.heroInstances[f.id]);
    delete AV.state.heroInstances[sacrificeInstanceId];
    inst.ascensionRank += 1;
    AV.save();
    return { ok: true, newRank: inst.ascensionRank };
  };
})(window.AV);
