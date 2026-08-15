/* ==========================================================================
   src/data/armorSets.js
   Armor: 4 pieces per set (helmet, chest plate, leggings, weapon).
   Each named set is themed to a hero class. A full matching set grants
   +1000 HP / +500 ATK / +50 SPD / +750 DEF. On a hero whose class matches
   the set's theme, ALL bonuses (per-piece and full-set) are doubled.
   Obtained only from the Armor Dungeon.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  const PIECES = ["helmet", "chestplate", "leggings", "weapon"];

  // Per-piece base bonus (before the full-set bonus, before class doubling)
  const PIECE_BONUS = { hp: 150, attack: 60, speed: 5, defense: 90 };
  const FULL_SET_BONUS = { hp: 1000, attack: 500, speed: 50, defense: 750 };

  const SET_DEFS = [
    { key: "wardensPlate", name: "Warden's Plate", theme: "Tank", rarity: "Epic" },
    { key: "ashreaverEdge", name: "Ashreaver Edge", theme: "Warrior", rarity: "Epic" },
    { key: "veilwalkerShroud", name: "Veilwalker Shroud", theme: "Assassin", rarity: "Legendary" },
    { key: "emberweaveRobes", name: "Emberweave Robes", theme: "Mage", rarity: "Legendary" },
    { key: "sanctifiedVestments", name: "Sanctified Vestments", theme: "Support", rarity: "Rare" },
    { key: "hawkeyeCord", name: "Hawkeye Cord", theme: "Ranger", rarity: "Rare" },
  ];

  function buildSet(def) {
    const pieces = {};
    PIECES.forEach((p) => {
      pieces[p] = {
        id: `${def.key}_${p}`,
        piece: p,
        setKey: def.key,
        name: `${def.name} ${p.charAt(0).toUpperCase() + p.slice(1)}`,
        rarity: def.rarity,
        equippedOn: null, // heroInstanceId or null
        bonus: { ...PIECE_BONUS },
      };
    });
    return { ...def, pieces, fullSetBonus: { ...FULL_SET_BONUS } };
  }

  AV.ARMOR_SETS = SET_DEFS.map(buildSet);
  AV.ARMOR_PIECES = PIECES;

  /** Compute total armor stats for a hero given the 4 equipped piece ids (or nulls). */
  AV.computeArmorBonus = function computeArmorBonus(heroClass, equippedPieceIds) {
    const total = { hp: 0, attack: 0, speed: 0, defense: 0 };
    if (!equippedPieceIds) return total;
    const equipped = equippedPieceIds.filter(Boolean);
    if (equipped.length === 0) return total;

    // group by set
    const bySet = {};
    equipped.forEach((pid) => {
      const [setKey] = pid.split("_");
      // per-piece bonus always applies regardless of set completion
      const setDef = AV.ARMOR_SETS.find((s) => s.key === setKey);
      if (!setDef) return;
      const doubled = setDef.theme === heroClass ? 2 : 1;
      Object.keys(PIECE_BONUS).forEach((stat) => {
        total[stat] += PIECE_BONUS[stat] * doubled;
      });
      bySet[setKey] = (bySet[setKey] || 0) + 1;
    });

    Object.entries(bySet).forEach(([setKey, count]) => {
      if (count === 4) {
        const setDef = AV.ARMOR_SETS.find((s) => s.key === setKey);
        const doubled = setDef.theme === heroClass ? 2 : 1;
        Object.keys(FULL_SET_BONUS).forEach((stat) => {
          total[stat] += FULL_SET_BONUS[stat] * doubled;
        });
      }
    });

    return total;
  };
})(window.AV);
