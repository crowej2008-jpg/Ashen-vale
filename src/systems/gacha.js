/* ==========================================================================
   src/systems/gacha.js
   Hero gacha (Summoning Scrolls) and Artifact gacha (Artifact Summoning
   Stones). Rate table skews toward low grades with rarer high grades.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  const HERO_GRADE_WEIGHTS = { 1: 40, 2: 30, 3: 18, 4: 9, 5: 3 };
  const ARTIFACT_GRADE_WEIGHTS = { 1: 35, 2: 28, 3: 20, 4: 12, 5: 5 };

  AV.SUMMON_SCROLL_COST_GOLD = 5000;
  AV.ARTIFACT_STONE_COST_TOKENS = 40;

  AV.summonHero = function summonHero() {
    if (AV.state.currencies.summoningScrolls < 1) return { error: "Not enough Summoning Scrolls." };
    AV.state.currencies.summoningScrolls -= 1;

    const grade = AV.pickWeighted(
      Object.entries(HERO_GRADE_WEIGHTS).map(([g, w]) => ({ item: Number(g), weight: w }))
    );
    const pool = AV.HERO_TEMPLATES.filter((h) => h.grade === grade);
    const tpl = pool[AV.randInt(0, pool.length - 1)];
    const inst = AV.grantHero(tpl.id);
    AV.save();
    return { instance: inst, template: tpl };
  };

  AV.summonArtifact = function summonArtifact() {
    if (AV.state.currencies.artifactStones < 1) return { error: "Not enough Artifact Summoning Stones." };
    AV.state.currencies.artifactStones -= 1;

    const grade = AV.pickWeighted(
      Object.entries(ARTIFACT_GRADE_WEIGHTS).map(([g, w]) => ({ item: Number(g), weight: w }))
    );
    const pool = AV.ARTIFACT_TEMPLATES.filter((a) => a.grade === grade);
    const tpl = pool.length ? pool[AV.randInt(0, pool.length - 1)] : AV.ARTIFACT_TEMPLATES[0];

    const id = AV.uid("art");
    AV.state.artifactInventory[id] = { id, templateKey: tpl.key, stars: 1, equippedOn: null };
    AV.save();
    return { instanceId: id, template: tpl };
  };

  AV.buyScrollsWithTokens = function buyScrollsWithTokens(qty, costPerScroll = 15) {
    const total = qty * costPerScroll;
    if (AV.state.currencies.arenaTokens < total) return { error: "Not enough Arena Tokens." };
    AV.state.currencies.arenaTokens -= total;
    AV.state.currencies.summoningScrolls += qty;
    AV.save();
    return { ok: true };
  };

  AV.buyArtifactStonesWithTokens = function buyArtifactStonesWithTokens(qty, costPerStone = 40) {
    const total = qty * costPerStone;
    if (AV.state.currencies.arenaTokens < total) return { error: "Not enough Arena Tokens." };
    AV.state.currencies.arenaTokens -= total;
    AV.state.currencies.artifactStones += qty;
    AV.save();
    return { ok: true };
  };

  AV.buyHeroCopyWithGold = function buyHeroCopyWithGold(templateId) {
    const tpl = AV.template(templateId);
    const cost = tpl.grade * 8000;
    if (AV.state.currencies.gold < cost) return { error: "Not enough gold." };
    AV.state.currencies.gold -= cost;
    const inst = AV.grantHero(templateId);
    AV.save();
    return { instance: inst, cost };
  };
})(window.AV);
