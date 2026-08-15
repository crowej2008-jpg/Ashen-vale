/* ==========================================================================
   src/data/heroes.js
   Defines the 40 heroes of Ashen Vale (20 original + 20 "Reach of Cinder"
   expansion heroes). Data-driven: each hero is generated from a name/class/
   grade table plus deterministic stat curves, so balance stays consistent
   across all 40 without hand-tuning 40 separate stat blocks.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  const CLASSES = ["Warrior", "Tank", "Mage", "Assassin", "Support", "Ranger"];

  // grade -> base stat multiplier (5 is rarest/strongest)
  const GRADE_MULT = { 1: 1.0, 2: 1.25, 3: 1.6, 4: 2.1, 5: 2.8 };

  // Energy requirement pool. Heroes that need 500 energy get a stat bump
  // to compensate for the slower skill cadence.
  const ENERGY_TIERS = [300, 350, 400, 450, 500];

  const ROSTER = [
    // --- Original 20 --------------------------------------------------
    ["Kael Ashborn", "Warrior", 4], ["Dame Virelle", "Tank", 3], ["Pyrrhine", "Mage", 5],
    ["Nyxa Coldwhisper", "Assassin", 4], ["Brother Ossian", "Support", 3], ["Fennric Longshot", "Ranger", 3],
    ["Grael Stonejaw", "Tank", 2], ["Seraphine Vell", "Support", 4], ["Tormund Ashe", "Warrior", 2],
    ["Ilyra Duskbane", "Mage", 4], ["Corvin Blackfeather", "Assassin", 3], ["Halric the Warden", "Tank", 4],
    ["Wrenna Fairwind", "Ranger", 2], ["Malzora", "Mage", 3], ["Sir Dothric", "Warrior", 3],
    ["Quill Sharpstep", "Assassin", 2], ["Mother Yseult", "Support", 5], ["Baelor Emberstrike", "Warrior", 5],
    ["Thessaly Nightglass", "Mage", 2], ["Roderin Vane", "Ranger", 4],
    // --- Reach of Cinder expansion, 20 -----------------------------------
    ["Ashen Matriarch Ozra", "Support", 5], ["Draven Hollowmark", "Warrior", 3], ["Kestrel Vane", "Ranger", 3],
    ["Sybbil Thorncoat", "Assassin", 5], ["Grimhold", "Tank", 5], ["Faelan Brightspear", "Warrior", 4],
    ["Una Moss-eye", "Support", 2], ["Cindra Wraithsong", "Mage", 4], ["Bruncle Ironhide", "Tank", 3],
    ["Pell Duskwalker", "Ranger", 2], ["Voryn the Hollow", "Assassin", 4], ["Sister Amareth", "Support", 3],
    ["Krogath", "Tank", 2], ["Lys Emberfall", "Mage", 5], ["Harwin Steelbrow", "Warrior", 2],
    ["Nettle", "Assassin", 2], ["Elowen Starcaller", "Mage", 3], ["Doric Vane-Hollis", "Ranger", 5],
    ["Marrow Ghast", "Tank", 4], ["Tibalt Quickblade", "Assassin", 3],
  ];

  const UNIQUE_EFFECT_VERBS = {
    Warrior: "gains a stacking Rage charge, +4% attack per charge",
    Tank: "raises a Bulwark, redirecting 15% of damage from the lowest-HP ally to itself",
    Mage: "detonates residual arcane static, dealing splash damage to two random enemies",
    Assassin: "marks the lowest-HP enemy, guaranteeing the next basic attack crits",
    Support: "channels a Tidewave, restoring HP to the two lowest-HP allies",
    Ranger: "fires a piercing volley, applying a stacking armor-shred to all enemies",
  };

  function baseStatsFor(grade, energyReq) {
    const m = GRADE_MULT[grade];
    const energyBump = energyReq === 500 ? 1.15 : energyReq === 450 ? 1.07 : 1.0;
    return {
      hp: Math.round(1800 * m * energyBump),
      attack: Math.round(180 * m * energyBump),
      defense: Math.round(90 * m * energyBump),
      speed: Math.round(95 + grade * 4),
      critChance: 0.15 + grade * 0.02,
      critDamage: 1.5 + grade * 0.05,
      blockChance: 0.05 + (grade >= 4 ? 0.05 : 0),
      blockStrength: 0.3,
      dodgeChance: 0.05 + grade * 0.01,
    };
  }

  function makeHero(id, [name, cls, grade], idx) {
    const energyReq = ENERGY_TIERS[idx % ENERGY_TIERS.length];
    const basicEnergyGain = 50 + (idx % 5) * 5; // 50-70
    const stats = baseStatsFor(grade, energyReq);
    return {
      id,
      name,
      class: cls,
      grade,
      energyReq,
      basicEnergyGain,
      baseStats: stats,
      // Progression state (per-copy state lives on roster instances, not here)
      activeSkill: {
        name: `${name.split(" ")[0]}'s ${cls === "Support" ? "Benediction" : "Reckoning"}`,
        description: `Unleashes a powerful ${cls.toLowerCase()} technique once ${energyReq} energy is filled.`,
      },
      passives: [
        {
          tier: 1,
          unlockEvolution: 0,
          type: "flat",
          name: "Hardened Body",
          description: "Grants flat bonus stats (available at base copy).",
          value: { hp: Math.round(150 * GRADE_MULT[grade]), attack: Math.round(15 * GRADE_MULT[grade]), defense: Math.round(10 * GRADE_MULT[grade]) },
        },
        {
          tier: 2,
          unlockEvolution: 2,
          type: "percent",
          name: "Honed Instincts",
          description: "Grants a percentage stat bonus.",
          value: { attackPct: 0.08, hpPct: 0.06 },
        },
        {
          tier: 3,
          unlockEvolution: 4,
          type: "unique",
          name: `${name.split(" ")[0]}'s Mark`,
          description: `Every 2 turns, ${UNIQUE_EFFECT_VERBS[cls]}.`,
          triggerEveryTurns: 2,
        },
        {
          tier: 4,
          unlockEvolution: 6,
          type: "procSkill",
          name: "Flash Technique",
          description: "25% chance to trigger instead of a basic attack; fills 150 energy when it does.",
          chance: 0.25,
          energyFill: 150,
        },
      ],
    };
  }

  AV.HERO_CLASSES = CLASSES;
  AV.HERO_TEMPLATES = ROSTER.map((row, i) => makeHero(`h${i + 1}`, row, i));
})(window.AV);
