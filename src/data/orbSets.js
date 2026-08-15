/* ==========================================================================
   src/data/orbSets.js
   Orb system: up to 8 orbs equipped per hero. Orbs level 1-10 (3 copies per
   level). Rarities: purple (worst) < orange < red (best). Omega sets need
   3 distinct orbs to complete; Prime sets need 5. Set bonuses unlock at
   combined equipped-set-orb levels of 3 / 5 / 7 / 10.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  const RARITIES = ["purple", "orange", "red"]; // worst -> best
  const RARITY_LABEL = { purple: "Purple", orange: "Orange", red: "Red" };

  const OMEGA_NAMES = [
    "Cinder", "Frostbind", "Wraithstep", "Ironwill", "Bloodpact",
    "Stormcall", "Gravebound", "Sunflare", "Nightveil", "Thornroot",
  ];
  const PRIME_NAMES = [
    "Dragon's Hoard", "Hollow Crown", "Titan's Foundation", "Void Choir", "Emberfall Dynasty",
    "Wyrmscale Accord", "Lantern of Ashes", "Widow's Bargain", "Skyward Vigil", "Ruin's Embrace",
  ];

  function bonusForTier(setSize, tierIndex) {
    // tierIndex 0..3 corresponds to combined-level thresholds 3/5/7/10
    const scale = [1, 1.8, 2.6, 4][tierIndex];
    const base = setSize === 3 ? 4 : 3; // omega hits harder per orb, prime spreads wider
    return { statPct: Math.round(base * scale * 10) / 10 };
  }

  function buildSet(name, size, family) {
    const key = `${family}_${name.replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
    const orbs = Array.from({ length: size }, (_, i) => ({
      id: `${key}_orb${i + 1}`,
      setKey: key,
      name: `${name} Orb ${i + 1}`,
      rarity: RARITIES[i % RARITIES.length],
    }));
    return {
      key,
      family,
      name,
      size,
      orbs,
      thresholds: [3, 5, 7, 10].map((lvl, idx) => ({
        level: lvl,
        bonus: bonusForTier(size, idx),
        description: `At combined level ${lvl}: +${bonusForTier(size, idx).statPct}% to the set's signature stat.`,
      })),
    };
  }

  AV.ORB_RARITIES = RARITIES;
  AV.ORB_RARITY_LABEL = RARITY_LABEL;
  AV.OMEGA_SETS = OMEGA_NAMES.map((n) => buildSet(n, 3, "omega"));
  AV.PRIME_SETS = PRIME_NAMES.map((n) => buildSet(n, 5, "prime"));
  AV.ALL_ORB_SETS = [...AV.OMEGA_SETS, ...AV.PRIME_SETS];

  AV.ORB_MAX_LEVEL = 10;
  AV.ORB_COPIES_PER_LEVEL = 3;
  AV.ORB_SLOTS_PER_HERO = 8;
  AV.ORB_SHOP_REFRESH_MS = 15 * 60 * 1000;
})(window.AV);
