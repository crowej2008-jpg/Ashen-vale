/* ==========================================================================
   src/data/artifacts.js
   Artifacts: equipped onto a hero (1 per hero), each with a unique effect.
   Pulled from the Artifact gacha (Artifact Summoning Stones). Upgradable
   1-5 stars, each star requiring 1 copy of that same artifact.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  const ARTIFACT_DEFS = [
    { key: "emberheart", name: "Emberheart Core", grade: 5, effect: "On skill cast, deal bonus true damage equal to 8% of the caster's attack." },
    { key: "voidshard", name: "Voidshard Lattice", grade: 5, effect: "Grants immunity to the first crit taken each battle." },
    { key: "graveoath", name: "Grave Oath Seal", grade: 4, effect: "When this hero drops below 30% HP, instantly gain 200 energy (once per battle)." },
    { key: "thornmail", name: "Thornmail Fragment", grade: 3, effect: "Reflect 10% of damage taken back at the attacker." },
    { key: "windstep", name: "Windstep Charm", grade: 3, effect: "+15% speed, but -5% max HP." },
    { key: "hollowlens", name: "Hollow Lens", grade: 4, effect: "Increases crit damage dealt to enemies below 50% HP by 25%." },
    { key: "ironroot", name: "Ironroot Talisman", grade: 2, effect: "+10% block strength." },
    { key: "duskvial", name: "Duskvial", grade: 3, effect: "Heal 3% max HP whenever this hero lands a crit." },
    { key: "sunder", name: "Sunder Fang", grade: 4, effect: "Basic attacks reduce the target's defense by 4%, stacking up to 5 times." },
    { key: "wardstone", name: "Wardstone Shard", grade: 2, effect: "+8% dodge chance." },
    { key: "phoenixdown", name: "Phoenix Down Feather", grade: 5, effect: "Once per battle, revive with 25% HP instead of dying." },
    { key: "cindercoin", name: "Cinder Coin", grade: 1, effect: "+5% gold earned from battle rewards involving this hero." },
  ];

  AV.ARTIFACT_TEMPLATES = ARTIFACT_DEFS.map((d) => ({
    ...d,
    maxStars: 5,
    copiesPerStar: 1,
  }));
})(window.AV);
