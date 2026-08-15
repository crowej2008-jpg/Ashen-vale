/* ==========================================================================
   src/systems/stats.js
   Computes a hero instance's FULL effective stat sheet by layering:
   base template stats -> level curve -> evolution passives (P1 flat, P2 %)
   -> armor -> soul statue (global flat) -> awakening -> orb sets/singles
   -> formation class bonus (applied separately at battle time since it
   depends on the whole formation, not just this hero).

   Percent stats are computed on top of flat stats, matching the spec's
   worked example (5,000 flat atk + 50% atk% = 7,500 atk).
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  const AWAKENING_TIERS = ["E-", "E", "E+", "D", "C", "B", "A", "S", "SS", "SSS"];
  AV.AWAKENING_TIERS = AWAKENING_TIERS;

  function levelMultiplier(level) {
    // Smooth curve: level 1 = 1.0x, level 100 = 4.0x
    return 1 + (level - 1) * (3 / 99);
  }

  function unlockedPassives(template, stars) {
    return template.passives.filter((p) => stars >= p.unlockEvolution);
  }

  /** Returns { hp, attack, defense, speed, critChance, critDamage, blockChance,
   *  blockStrength, dodgeChance, hpPct, attackPct, defensePct } fully resolved. */
  AV.computeHeroStats = function computeHeroStats(instance) {
    const template = AV.template(instance.templateId);
    if (!template) return null;
    const base = template.baseStats;
    const lvlMult = levelMultiplier(instance.level);

    let flat = {
      hp: base.hp * lvlMult,
      attack: base.attack * lvlMult,
      defense: base.defense * lvlMult,
      speed: base.speed,
      critChance: base.critChance,
      critDamage: base.critDamage,
      blockChance: base.blockChance,
      blockStrength: base.blockStrength,
      dodgeChance: base.dodgeChance,
    };
    let pct = { hp: 0, attack: 0, defense: 0 };

    // Evolution passives
    unlockedPassives(template, instance.stars).forEach((p) => {
      if (p.type === "flat") {
        flat.hp += p.value.hp || 0;
        flat.attack += p.value.attack || 0;
        flat.defense += p.value.defense || 0;
      } else if (p.type === "percent") {
        pct.attack += p.value.attackPct || 0;
        pct.hp += p.value.hpPct || 0;
      }
    });

    // Armor
    const armorBonus = AV.computeArmorBonus(template.class, instance.equippedArmor);
    flat.hp += armorBonus.hp;
    flat.attack += armorBonus.attack;
    flat.defense += armorBonus.defense;
    flat.speed += armorBonus.speed;

    // Soul Statue (global, applies to every hero)
    const statueBonus = AV.soulStatueBonus ? AV.soulStatueBonus() : { hp: 0, attack: 0, defense: 0 };
    flat.hp += statueBonus.hp;
    flat.attack += statueBonus.attack;
    flat.defense += statueBonus.defense;

    // Player-level milestone bonus (global, applies to every hero)
    const playerBonus = AV.globalPlayerBonus ? AV.globalPlayerBonus() : { hp: 0, attack: 0, defense: 0 };
    flat.hp += playerBonus.hp;
    flat.attack += playerBonus.attack;
    flat.defense += playerBonus.defense;

    // Awakening
    if (instance.awakeningTier >= 0) {
      const tierScale = (instance.awakeningTier + 1) / AWAKENING_TIERS.length; // 0.1 .. 1.0
      pct.attack += 0.05 + tierScale * 0.25;
      pct.hp += 0.05 + tierScale * 0.25;
      flat.critDamage = (flat.critDamage || 0) + 0.1 + tierScale * 0.3;
    }

    // Orbs (sets + singles)
    if (AV.computeOrbBonus) {
      const orbBonus = AV.computeOrbBonus(instance);
      pct.attack += orbBonus.attackPct || 0;
      pct.hp += orbBonus.hpPct || 0;
      pct.defense += orbBonus.defensePct || 0;
      flat.critChance += orbBonus.critChance || 0;
      flat.critDamage += orbBonus.critDamage || 0;
      flat.speed += orbBonus.speed || 0;
    }

    // Artifact
    if (instance.artifactId && AV.state.artifactInventory[instance.artifactId]) {
      const art = AV.state.artifactInventory[instance.artifactId];
      const def = AV.ARTIFACT_TEMPLATES.find((t) => t.key === art.templateKey);
      if (def && def.key === "windstep") {
        flat.speed *= 1.15;
        pct.hp -= 0.05;
      }
    }

    const final = {
      hp: Math.round(flat.hp * (1 + pct.hp)),
      attack: Math.round(flat.attack * (1 + pct.attack)),
      defense: Math.round(flat.defense * (1 + pct.defense)),
      speed: Math.round(flat.speed),
      critChance: AV.clamp(flat.critChance, 0, 1),
      critDamage: flat.critDamage,
      blockChance: AV.clamp(flat.blockChance, 0, 1),
      blockStrength: flat.blockStrength,
      dodgeChance: AV.clamp(flat.dodgeChance, 0, 0.75),
      energyReq: template.energyReq,
      basicEnergyGain: template.basicEnergyGain,
    };
    return final;
  };

  AV.computeCP = function computeCP(instance) {
    const s = AV.computeHeroStats(instance);
    if (!s) return 0;
    return Math.round(
      s.hp * 0.35 + s.attack * 5.5 + s.defense * 4 + s.speed * 8 +
      s.critChance * 3000 + (s.critDamage - 1) * 1500 + s.blockChance * 1200 + s.dodgeChance * 1500
    );
  };
})(window.AV);
