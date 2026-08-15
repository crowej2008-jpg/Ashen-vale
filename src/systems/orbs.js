/* ==========================================================================
   src/systems/orbs.js
   Orb shop (rotates every 15 min, sells individual orbs from Omega/Prime
   sets and stray singles), equipping (up to 8 per hero), leveling (1-10,
   3 copies per level), and set-bonus aggregation for stats.js.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  function randomOrbDef() {
    const set = AV.ALL_ORB_SETS[AV.randInt(0, AV.ALL_ORB_SETS.length - 1)];
    const orbDef = set.orbs[AV.randInt(0, set.orbs.length - 1)];
    return orbDef;
  }

  AV.refreshOrbShopIfNeeded = function refreshOrbShopIfNeeded() {
    const now = Date.now();
    if (now - AV.state.orbShop.lastRefresh < AV.ORB_SHOP_REFRESH_MS && AV.state.orbShop.stock.length) return;
    AV.state.orbShop.stock = Array.from({ length: 6 }, () => {
      const def = randomOrbDef();
      const priceByRarity = { purple: 400, orange: 900, red: 2200 };
      return { ...def, price: priceByRarity[def.rarity], stockId: AV.uid("stock") };
    });
    AV.state.orbShop.lastRefresh = now;
    AV.save();
  };

  AV.orbShopTimeRemainingMs = function orbShopTimeRemainingMs() {
    const elapsed = Date.now() - AV.state.orbShop.lastRefresh;
    return Math.max(0, AV.ORB_SHOP_REFRESH_MS - elapsed);
  };

  AV.buyOrbFromShop = function buyOrbFromShop(stockId) {
    const item = AV.state.orbShop.stock.find((s) => s.stockId === stockId);
    if (!item) return { error: "That item is no longer available." };
    if (AV.state.currencies.gold < item.price) return { error: "Not enough gold." };
    AV.state.currencies.gold -= item.price;
    const id = AV.uid("orb");
    AV.state.orbInventory[id] = {
      id, orbDefId: item.id, setKey: item.setKey, rarity: item.rarity, level: 1, equippedOn: null, slotIndex: null,
    };
    AV.save();
    return { ok: true, orbId: id };
  };

  AV.equipOrb = function equipOrb(orbInstanceId, heroInstanceId, slotIndex) {
    const orb = AV.state.orbInventory[orbInstanceId];
    const hero = AV.state.heroInstances[heroInstanceId];
    if (!orb || !hero) return { error: "Invalid orb or hero." };
    if (slotIndex < 0 || slotIndex >= AV.ORB_SLOTS_PER_HERO) return { error: "Invalid orb slot." };

    // Clear whatever is in that slot.
    const currentOrbId = hero.orbIds[slotIndex];
    if (currentOrbId) {
      const currentOrb = AV.state.orbInventory[currentOrbId];
      if (currentOrb) { currentOrb.equippedOn = null; currentOrb.slotIndex = null; }
    }
    // Clear this orb from wherever it was.
    if (orb.equippedOn) {
      const prevHero = AV.state.heroInstances[orb.equippedOn];
      if (prevHero && orb.slotIndex != null) prevHero.orbIds[orb.slotIndex] = null;
    }
    hero.orbIds[slotIndex] = orbInstanceId;
    orb.equippedOn = heroInstanceId;
    orb.slotIndex = slotIndex;
    AV.save();
    return { ok: true };
  };

  AV.unequipOrb = function unequipOrb(heroInstanceId, slotIndex) {
    const hero = AV.state.heroInstances[heroInstanceId];
    if (!hero) return { error: "Invalid hero." };
    const orbId = hero.orbIds[slotIndex];
    if (orbId) {
      const orb = AV.state.orbInventory[orbId];
      if (orb) { orb.equippedOn = null; orb.slotIndex = null; }
    }
    hero.orbIds[slotIndex] = null;
    AV.save();
    return { ok: true };
  };

  AV.orbFodder = function orbFodder(orbInstanceId) {
    const orb = AV.state.orbInventory[orbInstanceId];
    if (!orb) return [];
    return Object.values(AV.state.orbInventory).filter(
      (o) => o.orbDefId === orb.orbDefId && o.id !== orbInstanceId && !o.equippedOn
    );
  };

  AV.levelUpOrb = function levelUpOrb(orbInstanceId) {
    const orb = AV.state.orbInventory[orbInstanceId];
    if (!orb) return { error: "Invalid orb." };
    if (orb.level >= AV.ORB_MAX_LEVEL) return { error: "Orb already at max level (10)." };
    const fodder = AV.orbFodder(orbInstanceId);
    if (fodder.length < AV.ORB_COPIES_PER_LEVEL) {
      return { error: `Need ${AV.ORB_COPIES_PER_LEVEL} copies of this exact orb (have ${fodder.length}).` };
    }
    fodder.slice(0, AV.ORB_COPIES_PER_LEVEL).forEach((f) => delete AV.state.orbInventory[f.id]);
    orb.level += 1;
    AV.save();
    return { ok: true, newLevel: orb.level };
  };

  const SINGLE_ORB_BONUS = { purple: 0.01, orange: 0.02, red: 0.035 };

  /** Aggregates set + single-orb bonuses equipped on one hero instance. */
  AV.computeOrbBonus = function computeOrbBonus(instance) {
    const result = { attackPct: 0, hpPct: 0, defensePct: 0, critChance: 0, critDamage: 0, speed: 0 };
    const equipped = instance.orbIds.map((id) => (id ? AV.state.orbInventory[id] : null)).filter(Boolean);
    if (!equipped.length) return result;

    // Single-orb bonus (always applies per orb, scaled by rarity + level).
    equipped.forEach((orb) => {
      const base = SINGLE_ORB_BONUS[orb.rarity] || 0.01;
      result.attackPct += base * (1 + (orb.level - 1) * 0.15);
    });

    // Set bonuses: group by setKey, sum combined levels, compare to thresholds.
    const bySet = {};
    equipped.forEach((orb) => {
      if (!orb.setKey) return;
      bySet[orb.setKey] = bySet[orb.setKey] || { orbs: [], combinedLevel: 0 };
      bySet[orb.setKey].orbs.push(orb);
      bySet[orb.setKey].combinedLevel += orb.level;
    });

    Object.entries(bySet).forEach(([setKey, data]) => {
      const setDef = AV.ALL_ORB_SETS.find((s) => s.key === setKey);
      if (!setDef) return;
      const distinctOwned = new Set(data.orbs.map((o) => o.orbDefId)).size;
      if (distinctOwned < setDef.size) return; // must equip all distinct orbs in the set to activate thresholds
      setDef.thresholds.forEach((t) => {
        if (data.combinedLevel >= t.level) {
          const pct = t.bonus.statPct / 100;
          result.attackPct += pct * 0.6;
          result.hpPct += pct * 0.4;
        }
      });
    });

    return result;
  };
})(window.AV);
