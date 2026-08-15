/* ==========================================================================
   src/systems/armor.js
   Armor Dungeon drops, equipping pieces onto heroes (via the Hero Details
   armor popup), and the Disassembly Machine (armor -> Armor Souls, used
   to upgrade Legendary-rarity armor specifically).
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.runArmorDungeon = function runArmorDungeon() {
    // Random piece from a random set.
    const setDef = AV.ARMOR_SETS[AV.randInt(0, AV.ARMOR_SETS.length - 1)];
    const pieceKey = AV.ARMOR_PIECES[AV.randInt(0, AV.ARMOR_PIECES.length - 1)];
    const pieceDef = setDef.pieces[pieceKey];
    const id = AV.uid("armor");
    AV.state.armorInventory[id] = {
      id,
      defId: pieceDef.id,
      setKey: setDef.key,
      piece: pieceKey,
      rarity: setDef.rarity,
      equippedOn: null,
      soulUpgrades: 0, // legendary-only stat upgrades from Armor Souls
    };
    AV.save();
    return AV.state.armorInventory[id];
  };

  AV.equipArmor = function equipArmor(armorInstanceId, heroInstanceId) {
    const armor = AV.state.armorInventory[armorInstanceId];
    const hero = AV.state.heroInstances[heroInstanceId];
    if (!armor || !hero) return { error: "Invalid armor or hero." };

    // Unequip whatever currently occupies that piece slot on this hero.
    const pieceIdx = AV.ARMOR_PIECES.indexOf(armor.piece);
    const current = hero.equippedArmor[pieceIdx];
    if (current) {
      const currentArmor = AV.state.armorInventory[current];
      if (currentArmor) currentArmor.equippedOn = null;
    }
    // If this armor piece was equipped elsewhere, clear it there first.
    if (armor.equippedOn) {
      const prevHero = AV.state.heroInstances[armor.equippedOn];
      if (prevHero) {
        const idx = prevHero.equippedArmor.indexOf(armorInstanceId);
        if (idx !== -1) prevHero.equippedArmor[idx] = null;
      }
    }

    hero.equippedArmor[pieceIdx] = armorInstanceId;
    armor.equippedOn = heroInstanceId;
    AV.save();
    return { ok: true };
  };

  AV.unequipArmor = function unequipArmor(heroInstanceId, pieceIdx) {
    const hero = AV.state.heroInstances[heroInstanceId];
    if (!hero) return { error: "Invalid hero." };
    const armorId = hero.equippedArmor[pieceIdx];
    if (armorId) {
      const armor = AV.state.armorInventory[armorId];
      if (armor) armor.equippedOn = null;
    }
    hero.equippedArmor[pieceIdx] = null;
    AV.save();
    return { ok: true };
  };

  AV.disassembleArmor = function disassembleArmor(armorInstanceId) {
    const armor = AV.state.armorInventory[armorInstanceId];
    if (!armor) return { error: "Invalid armor." };
    if (armor.equippedOn) return { error: "Unequip this armor before disassembling it." };
    const soulsGained = { Rare: 3, Epic: 6, Legendary: 12 }[armor.rarity] || 2;
    AV.state.armorSouls += soulsGained;
    delete AV.state.armorInventory[armorInstanceId];
    AV.save();
    return { ok: true, soulsGained };
  };

  AV.upgradeLegendaryArmorWithSouls = function upgradeLegendaryArmorWithSouls(armorInstanceId) {
    const armor = AV.state.armorInventory[armorInstanceId];
    if (!armor) return { error: "Invalid armor." };
    if (armor.rarity !== "Legendary") return { error: "Only Legendary armor can be upgraded with Armor Souls." };
    const cost = 5 + armor.soulUpgrades * 3;
    if (AV.state.armorSouls < cost) return { error: `Need ${cost} Armor Souls (have ${AV.state.armorSouls}).` };
    AV.state.armorSouls -= cost;
    armor.soulUpgrades += 1;
    AV.save();
    return { ok: true, level: armor.soulUpgrades };
  };

  AV.disassembleHero = function disassembleHero(instanceId) {
    const inst = AV.state.heroInstances[instanceId];
    if (!inst) return { error: "Invalid hero." };
    if (AV.state.formation.includes(instanceId)) return { error: "Remove this hero from the formation first." };
    const tpl = AV.template(inst.templateId);
    const soulsGained = 1 + inst.stars; // more evolved copies yield more souls
    AV.state.heroSouls[tpl.grade] = (AV.state.heroSouls[tpl.grade] || 0) + soulsGained;
    delete AV.state.heroInstances[instanceId];
    AV.save();
    return { ok: true, grade: tpl.grade, soulsGained };
  };
})(window.AV);
