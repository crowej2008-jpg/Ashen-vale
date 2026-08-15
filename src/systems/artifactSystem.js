/* ==========================================================================
   src/systems/artifactSystem.js
   Equipping artifacts onto heroes (Hero Details artifact popup) and
   upgrading them 1-5 stars, each star costing 1 copy of that same artifact.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.equipArtifact = function equipArtifact(artifactInstanceId, heroInstanceId) {
    const art = AV.state.artifactInventory[artifactInstanceId];
    const hero = AV.state.heroInstances[heroInstanceId];
    if (!art || !hero) return { error: "Invalid artifact or hero." };

    // Unequip whatever this hero currently has.
    if (hero.artifactId) {
      const prev = AV.state.artifactInventory[hero.artifactId];
      if (prev) prev.equippedOn = null;
    }
    // Unequip this artifact from wherever it was.
    if (art.equippedOn) {
      const prevHero = AV.state.heroInstances[art.equippedOn];
      if (prevHero) prevHero.artifactId = null;
    }
    hero.artifactId = artifactInstanceId;
    art.equippedOn = heroInstanceId;
    AV.save();
    return { ok: true };
  };

  AV.unequipArtifact = function unequipArtifact(heroInstanceId) {
    const hero = AV.state.heroInstances[heroInstanceId];
    if (!hero || !hero.artifactId) return { error: "No artifact equipped." };
    const art = AV.state.artifactInventory[hero.artifactId];
    if (art) art.equippedOn = null;
    hero.artifactId = null;
    AV.save();
    return { ok: true };
  };

  /** Copies of the same artifact template not currently equipped/being upgraded. */
  AV.artifactFodder = function artifactFodder(artifactInstanceId) {
    const art = AV.state.artifactInventory[artifactInstanceId];
    if (!art) return [];
    return Object.values(AV.state.artifactInventory).filter(
      (a) => a.templateKey === art.templateKey && a.id !== artifactInstanceId
    );
  };

  AV.upgradeArtifact = function upgradeArtifact(artifactInstanceId) {
    const art = AV.state.artifactInventory[artifactInstanceId];
    if (!art) return { error: "Invalid artifact." };
    const tpl = AV.ARTIFACT_TEMPLATES.find((t) => t.key === art.templateKey);
    if (art.stars >= tpl.maxStars) return { error: "Already at max stars (5)." };
    const fodder = AV.artifactFodder(artifactInstanceId);
    if (fodder.length < tpl.copiesPerStar) {
      return { error: `Need ${tpl.copiesPerStar} more cop${tpl.copiesPerStar > 1 ? "ies" : "y"} of this artifact.` };
    }
    fodder.slice(0, tpl.copiesPerStar).forEach((f) => delete AV.state.artifactInventory[f.id]);
    art.stars += 1;
    AV.save();
    return { ok: true, newStars: art.stars };
  };
})(window.AV);
