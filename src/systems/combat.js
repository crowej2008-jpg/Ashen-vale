/* ==========================================================================
   src/systems/combat.js
   Fully automatic turn-based combat. Players only choose hero selection and
   formation beforehand — no real-time input during the fight itself.

   Each round, combatants act in speed order. A combatant uses its active
   skill if energy >= energyReq, otherwise a basic attack (which grants
   energy). The 4th passive (procSkill) has a 25% chance to replace a basic
   attack, filling 150 energy when it triggers instead of the normal gain.
   The 3rd passive (unique) fires every 2 turns for that combatant.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  function buildCombatant(instance, side, classBonus) {
    const tpl = AV.template(instance.templateId);
    const stats = AV.computeHeroStats(instance);
    const bonus = classBonus && classBonus[instance.id] ? classBonus[instance.id] : { attackPct: 0, hpPct: 0 };
    const hp = Math.round(stats.hp * (1 + bonus.hpPct));
    const attack = Math.round(stats.attack * (1 + bonus.attackPct));
    return {
      id: instance.id,
      name: tpl.name,
      class: tpl.class,
      side,
      grade: tpl.grade,
      maxHp: hp,
      hp,
      attack,
      defense: stats.defense,
      speed: stats.speed,
      critChance: stats.critChance,
      critDamage: stats.critDamage,
      blockChance: stats.blockChance,
      blockStrength: stats.blockStrength,
      dodgeChance: stats.dodgeChance,
      energy: 0,
      energyReq: stats.energyReq,
      basicEnergyGain: stats.basicEnergyGain,
      turnCount: 0,
      passives: tpl.passives.filter((p) => p.unlockEvolution <= instance.stars),
      alive: true,
    };
  }

  /** Generates an enemy team scaled to a target average CP. */
  AV.generateEnemyTeam = function generateEnemyTeam(count, powerMult) {
    const pool = AV.HERO_TEMPLATES;
    const team = [];
    for (let i = 0; i < count; i++) {
      const tpl = pool[AV.randInt(0, pool.length - 1)];
      const stats = tpl.baseStats;
      const m = powerMult;
      team.push({
        id: `enemy_${i}_${AV.uid("e")}`,
        name: tpl.name,
        class: tpl.class,
        side: "enemy",
        grade: tpl.grade,
        maxHp: Math.round(stats.hp * m),
        hp: Math.round(stats.hp * m),
        attack: Math.round(stats.attack * m),
        defense: Math.round(stats.defense * m),
        speed: stats.speed,
        critChance: stats.critChance,
        critDamage: stats.critDamage,
        blockChance: stats.blockChance,
        blockStrength: stats.blockStrength,
        dodgeChance: stats.dodgeChance,
        energy: 0,
        energyReq: tpl.energyReq,
        basicEnergyGain: tpl.basicEnergyGain,
        turnCount: 0,
        passives: tpl.passives,
        alive: true,
      });
    }
    return team;
  };

  function rollHit(attacker, defender) {
    const dodged = Math.random() < defender.dodgeChance;
    if (dodged) return { dodged: true };
    const crit = Math.random() < attacker.critChance;
    const blocked = Math.random() < defender.blockChance;
    let dmg = Math.max(1, attacker.attack - defender.defense * 0.5);
    if (crit) dmg *= attacker.critDamage;
    if (blocked) dmg *= (1 - defender.blockStrength);
    return { dodged: false, crit, blocked, dmg: Math.round(dmg) };
  }

  function pickTarget(enemies) {
    const alive = enemies.filter((e) => e.alive);
    if (!alive.length) return null;
    // Prefer lowest HP% target for a bit of tactical feel.
    return alive.reduce((low, e) => (e.hp / e.maxHp < low.hp / low.maxHp ? e : low), alive[0]);
  }

  /** Runs a full automatic battle. Returns { winnerSide, rounds, log } */
  AV.runBattle = function runBattle(playerTeam, enemyTeam, maxRounds = 30) {
    const log = [];
    let round = 1;
    const allUnits = () => [...playerTeam, ...enemyTeam];

    while (round <= maxRounds) {
      const order = allUnits().filter((u) => u.alive).sort((a, b) => b.speed - a.speed);
      if (!order.length) break;

      for (const unit of order) {
        if (!unit.alive) continue;
        const enemies = unit.side === "player" ? enemyTeam : playerTeam;
        if (!enemies.some((e) => e.alive)) break;

        unit.turnCount += 1;

        // 3rd passive: unique effect every 2 turns.
        const p3 = unit.passives.find((p) => p.type === "unique");
        if (p3 && unit.turnCount % (p3.triggerEveryTurns || 2) === 0) {
          log.push({ round, actor: unit.name, side: unit.side, text: `${unit.name}'s Mark triggers: ${p3.description}` });
        }

        const p4 = unit.passives.find((p) => p.type === "procSkill");
        const procs = p4 && Math.random() < p4.chance;

        if (unit.energy >= unit.energyReq) {
          // Use active skill.
          const target = pickTarget(enemies);
          if (target) {
            const result = rollHit(unit, target);
            unit.energy = 0;
            if (result.dodged) {
              log.push({ round, actor: unit.name, side: unit.side, text: `${unit.name} unleashes their active skill — ${target.name} dodges!` });
            } else {
              const dmg = Math.round(result.dmg * 1.6); // skills hit harder than basics
              target.hp = Math.max(0, target.hp - dmg);
              log.push({
                round, actor: unit.name, side: unit.side,
                text: `${unit.name} unleashes their active skill on ${target.name} for ${dmg} damage${result.crit ? " (CRIT)" : ""}${result.blocked ? " (blocked)" : ""}.`,
              });
              if (target.hp <= 0) { target.alive = false; log.push({ round, actor: target.name, side: target.side, text: `${target.name} has fallen.` }); }
            }
          }
        } else if (procs) {
          unit.energy = Math.min(unit.energyReq, unit.energy + p4.energyFill);
          log.push({ round, actor: unit.name, side: unit.side, text: `${unit.name}'s Flash Technique triggers, filling energy instead of a basic attack.` });
        } else {
          const target = pickTarget(enemies);
          if (target) {
            const result = rollHit(unit, target);
            if (result.dodged) {
              log.push({ round, actor: unit.name, side: unit.side, text: `${unit.name} attacks — ${target.name} dodges!` });
            } else {
              target.hp = Math.max(0, target.hp - result.dmg);
              unit.energy = Math.min(unit.energyReq, unit.energy + unit.basicEnergyGain);
              log.push({
                round, actor: unit.name, side: unit.side,
                text: `${unit.name} attacks ${target.name} for ${result.dmg} damage${result.crit ? " (CRIT)" : ""}${result.blocked ? " (blocked)" : ""}.`,
              });
              if (target.hp <= 0) { target.alive = false; log.push({ round, actor: target.name, side: target.side, text: `${target.name} has fallen.` }); }
            }
          }
        }

        if (!playerTeam.some((u) => u.alive) || !enemyTeam.some((u) => u.alive)) break;
      }

      if (!playerTeam.some((u) => u.alive) || !enemyTeam.some((u) => u.alive)) break;
      round += 1;
    }

    const playerAlive = playerTeam.some((u) => u.alive);
    const enemyAlive = enemyTeam.some((u) => u.alive);
    let winnerSide = "draw";
    if (playerAlive && !enemyAlive) winnerSide = "player";
    else if (!playerAlive && enemyAlive) winnerSide = "enemy";

    return { winnerSide, rounds: round, log, playerTeam, enemyTeam };
  };

  AV.buildPlayerCombatTeam = function buildPlayerCombatTeam() {
    const classBonus = AV.computeFormationClassBonus();
    return AV.formationHeroes().map((inst) => buildCombatant(inst, "player", classBonus));
  };
})(window.AV);
