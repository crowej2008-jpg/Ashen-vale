import { HEROES_BY_ID } from "./heroes.js";

/* ============================== UTIL ============================== */
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const rnd = (n) => Math.floor(Math.random() * n);

export function sideList(battle, side) {
  return battle.units.filter((u) => u.side === side);
}

export function recalcStats(u) {
  let atkPct = 0, defPct = 0, spdPct = 0;
  for (const b of u.buffs) {
    if (b.stat === "atk") atkPct += b.amount;
    if (b.stat === "def") defPct += b.amount;
    if (b.stat === "spd") spdPct += b.amount;
  }
  u.atk = Math.max(1, Math.round(u.baseAtk * (1 + atkPct / 100)));
  u.def = Math.max(0, Math.round(u.baseDef * (1 + defPct / 100)));
  u.spd = Math.max(1, Math.round(u.baseSpd * (1 + spdPct / 100)));
}

export function applyBuff(u, stat, amount, turns) {
  u.buffs.push({ stat, amount, turns });
}

export function pickLowestHpUnit(list) {
  const a = list.filter((u) => u.alive);
  if (!a.length) return null;
  return a.reduce((x, y) => (x.hp / x.maxHp <= y.hp / y.maxHp ? x : y));
}
export function pickHighestAtkUnit(list) {
  const a = list.filter((u) => u.alive);
  if (!a.length) return null;
  return a.reduce((x, y) => (x.atk >= y.atk ? x : y));
}
export function pickFrontPriority(list) {
  const a = list.filter((u) => u.alive);
  if (!a.length) return null;
  const front = a.filter((u) => u.row === "front");
  const pool = front.length ? front : a.filter((u) => u.row === "back");
  return pickLowestHpUnit(pool.length ? pool : a);
}

export function killUnit(unit, log, killer) {
  unit.alive = false;
  unit.hp = 0;
  log.push(`☠️ ${unit.name} has fallen!`);
  if (killer && killer.alive && killer.artifact && killer.artifact.kind === "momentum") {
    killer.energy = Math.min(killer.energyMax + 200, killer.energy + killer.artifact.amount);
  }
}

export function dealDamage(attacker, target, multPct, opts = {}, log) {
  if (!target || !target.alive) return { dmg: 0, dead: false };
  if (!opts.guaranteedCrit && rnd(100) < target.dodge) {
    log.push(`🌀 ${target.name} dodges the attack!`);
    return { dmg: 0, dead: false, dodged: true };
  }
  let mult = multPct;
  const hpPct = (target.hp / target.maxHp) * 100;
  if (opts.executeBonus && hpPct < opts.executeBonus.threshold) mult += opts.executeBonus.bonusPct;
  if (attacker.artifact && attacker.artifact.kind === "execute" && hpPct < 40) mult += attacker.artifact.amount;
  const defStat = target.def * (1 - (opts.ignoreDefPct || 0) / 100);
  let dmg = Math.max(1, Math.round(attacker.atk * (mult / 100) - defStat * 0.5));
  let crit = false;
  if (opts.guaranteedCrit || rnd(100) < attacker.critChance) {
    crit = true;
    dmg = Math.round(dmg * (1 + attacker.critDmg / 100));
  }
  if (target.shield > 0) {
    const absorb = Math.min(target.shield, dmg);
    target.shield -= absorb;
    dmg -= absorb;
  }
  target.hp = Math.max(0, target.hp - dmg);
  log.push(`${crit ? "💥" : "⚔️"} ${attacker.name} hits ${target.name} for ${dmg}${crit ? " (CRIT!)" : ""}.`);
  if (dmg > 0 && attacker.artifact && attacker.artifact.kind === "lifesteal" && attacker.alive) {
    const h = Math.round((dmg * attacker.artifact.amount) / 100);
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + h);
    if (h > 0) log.push(`🩸 ${attacker.name} drains ${h} HP.`);
  }
  if (!opts.noRetaliate && dmg > 0 && target.artifact && target.artifact.kind === "reflect" && attacker.alive) {
    const r = Math.round((dmg * target.artifact.amount) / 100);
    attacker.hp = Math.max(0, attacker.hp - r);
    log.push(`🌵 Thorns reflect ${r} back at ${attacker.name}.`);
    if (attacker.hp <= 0 && attacker.alive) killUnit(attacker, log, target);
  }
  if (target.artifact && target.artifact.kind === "lastStand" && !target.usedLastStand && target.alive && (target.hp / target.maxHp) * 100 < 30) {
    target.shield += Math.round((target.maxHp * target.artifact.amount) / 100);
    target.usedLastStand = true;
    log.push(`✨ ${target.name}'s Guardian Ward shields them!`);
  }
  let dead = false;
  if (target.hp <= 0 && target.alive) {
    dead = true;
    killUnit(target, log, attacker);
  }
  if (!opts.noRetaliate && target.alive && target.artifact && target.artifact.kind === "counter" && rnd(100) < target.artifact.amount) {
    log.push(`↩️ ${target.name} counterattacks!`);
    dealDamage(target, attacker, 60, { noRetaliate: true }, log);
  }
  return { dmg, dead, crit };
}

export function castActive(battle, caster, spec, log) {
  const enemies = sideList(battle, caster.side === "player" ? "enemy" : "player");
  const allies = sideList(battle, caster.side);
  let targets = [];
  if (spec.target === "enemy") targets = [pickFrontPriority(enemies)];
  else if (spec.target === "anyLowestHpEnemy") targets = [pickLowestHpUnit(enemies)];
  else if (spec.target === "highestAtkEnemy") targets = [pickHighestAtkUnit(enemies)];
  else if (spec.target === "allEnemies") targets = enemies.filter((u) => u.alive);
  else if (spec.target === "randomEnemyX3") {
    const pool = enemies.filter((u) => u.alive);
    for (let i = 0; i < 3; i++) if (pool.length) targets.push(pool[rnd(pool.length)]);
  } else if (spec.target === "self") targets = [caster];
  else if (spec.target === "lowestHpAlly") targets = [pickLowestHpUnit(allies)];
  else if (spec.target === "allAllies") targets = allies.filter((u) => u.alive);
  else if (spec.target === "highestAtkAlly") targets = [pickHighestAtkUnit(allies)];
  targets = targets.filter(Boolean);

  let totalDmg = 0;
  for (const t of targets) {
    if (spec.kind === "damage") {
      const r = dealDamage(caster, t, spec.mult, { ignoreDefPct: spec.ignoreDefPct || 0, guaranteedCrit: !!spec.guaranteedCrit, executeBonus: spec.executeBonus }, log);
      totalDmg += r.dmg;
      if (spec.stunChance && t.alive && rnd(100) < spec.stunChance) {
        t.stunTurns = Math.max(t.stunTurns, 1);
        log.push(`❄️ ${t.name} is frozen and will skip a turn!`);
      }
      if (spec.andDebuff && t.alive) {
        applyBuff(t, spec.andDebuff.stat, -spec.andDebuff.amount, spec.andDebuff.turns);
        recalcStats(t);
        log.push(`🌀 ${t.name}'s ${spec.andDebuff.stat.toUpperCase()} is reduced!`);
      }
    } else if (spec.kind === "debuff") {
      applyBuff(t, spec.stat, -spec.amount, spec.turns);
      recalcStats(t);
      log.push(`🌀 ${t.name}'s ${spec.stat.toUpperCase()} is reduced!`);
    } else if (spec.kind === "heal") {
      const h = Math.round((t.maxHp * spec.pct) / 100);
      t.hp = Math.min(t.maxHp, t.hp + h);
      log.push(`💚 ${t.name} is healed for ${h}.`);
    } else if (spec.kind === "shield") {
      const s = Math.round((t.maxHp * spec.pct) / 100);
      t.shield += s;
      log.push(`🛡️ ${t.name} is shielded for ${s}.`);
      if (spec.andHealPct) {
        const h = Math.round((t.maxHp * spec.andHealPct) / 100);
        t.hp = Math.min(t.maxHp, t.hp + h);
        log.push(`💚 ${t.name} is also healed for ${h}.`);
      }
    } else if (spec.kind === "buff") {
      applyBuff(t, spec.stat, spec.amount, spec.turns);
      recalcStats(t);
      log.push(`⬆️ ${t.name}'s ${spec.stat.toUpperCase()} rises!`);
    } else if (spec.kind === "cleanse") {
      t.buffs = t.buffs.filter((b) => b.amount > 0);
      recalcStats(t);
      if (spec.andHealPct) {
        const h = Math.round((t.maxHp * spec.andHealPct) / 100);
        t.hp = Math.min(t.maxHp, t.hp + h);
      }
      log.push(`✨ ${t.name} is cleansed and restored.`);
    } else if (spec.kind === "energyFull") {
      t.energy = t.energyMax;
      applyBuff(t, "spd", spec.amount || 0, spec.turns || 2);
      recalcStats(t);
      log.push(`⏳ Time bends around ${t.name}!`);
    }
  }
  if (spec.selfShieldPct) {
    const s = Math.round((caster.maxHp * spec.selfShieldPct) / 100);
    caster.shield += s;
    log.push(`🛡️ ${caster.name} shields for ${s}.`);
  }
  if (spec.selfBuff) {
    applyBuff(caster, spec.selfBuff.stat, spec.selfBuff.amount, spec.selfBuff.turns);
    recalcStats(caster);
  }
  if (spec.selfHealPctOfDamageDealt && totalDmg > 0) {
    const h = Math.round((totalDmg * spec.selfHealPctOfDamageDealt) / 100);
    caster.hp = Math.min(caster.maxHp, caster.hp + h);
    log.push(`🩸 ${caster.name} drains ${h} HP from the assault.`);
  }
}

export function doTurn(battle, unit, log) {
  if (!unit.alive) return;
  if (unit.stunTurns > 0) {
    unit.stunTurns--;
    log.push(`💫 ${unit.name} is frozen and skips their turn.`);
    return;
  }
  unit.turnCount = (unit.turnCount || 0) + 1;

  if (unit.artifact && unit.artifact.kind === "regen") {
    const h = Math.round((unit.maxHp * unit.artifact.amount) / 100);
    unit.hp = Math.min(unit.maxHp, unit.hp + h);
    if (h > 0) log.push(`🌿 ${unit.name} regenerates ${h} HP.`);
  }

  const periodic = unit.passives[2];
  if (periodic && unit.star >= periodic.unlockStar && unit.turnCount % 2 === 0) {
    log.push(`🔷 ${unit.name}'s ${periodic.name} triggers!`);
    castActive(battle, unit, periodic.effect, log);
  }

  if (unit.energy >= unit.energyMax && unit.active) {
    unit.energy -= unit.energyMax;
    log.push(`✨ ${unit.name} unleashes ${unit.active.name}!`);
    castActive(battle, unit, unit.active, log);
  } else {
    const proc = unit.passives[3];
    if (proc && unit.star >= proc.unlockStar && rnd(100) < proc.chance) {
      log.push(`⭐ ${unit.name}'s ${proc.name} surges!`);
      castActive(battle, unit, proc.effect, log);
      unit.energy = Math.min(unit.energyMax + 150, unit.energy + proc.energyGain);
    } else {
      const enemies = sideList(battle, unit.side === "player" ? "enemy" : "player");
      const target = pickFrontPriority(enemies);
      if (target) dealDamage(unit, target, 100, {}, log);
      unit.energy = Math.min(unit.energyMax + 100, unit.energy + 50 + rnd(21));
    }
  }
  unit.buffs = unit.buffs.map((b) => ({ ...b, turns: b.turns - 1 })).filter((b) => b.turns > 0);
  recalcStats(unit);
}

/* ============================== UNIT CONSTRUCTION ============================== */
export function armorBonus(armor, role) {
  const ARMOR_SLOTS = ["helmet", "chest", "legs", "weapon"];
  const flat = { hp: 0, atk: 0, def: 0, spd: 0 };
  const pieces = ARMOR_SLOTS.map((s) => armor[s]).filter(Boolean);
  for (const p of pieces) {
    const mult = p.setRole === role ? 2 : 1;
    flat[p.stat] += p.amount * mult;
  }
  if (pieces.length === 4) {
    const ids = new Set(pieces.map((p) => p.setId));
    if (ids.size === 1) {
      const mult = pieces[0].setRole === role ? 2 : 1;
      flat.hp += 1000 * mult; flat.atk += 500 * mult; flat.spd += 50 * mult; flat.def += 750 * mult;
    }
  }
  return flat;
}

export function buildUnit(tpl, side, slot, opts = {}) {
  const { statMult = 1, star = 1, ascension = 0, armor = {}, artifact = null, namePrefix = "" } = opts;
  const row = slot < 3 ? "front" : "back";
  const evoMult = 1 + 0.09 * (star - 1);
  const ascMult = star >= 10 ? 1 + 0.05 * ascension : 1;
  const flatP = tpl.passives[0], pctP = tpl.passives[1];
  const armorFlat = armorBonus(armor, tpl.role);
  const flatFor = (statKey) => (flatP && star >= flatP.unlockStar && flatP.stat === statKey ? flatP.amount : 0) + (armorFlat[statKey] || 0);
  const pctFor = (statKey) => (pctP && star >= pctP.unlockStar && pctP.stat === statKey ? pctP.amount : 0);
  const mk = (base, statKey) => Math.max(1, Math.round(base * evoMult * ascMult * statMult * (1 + pctFor(statKey) / 100) + flatFor(statKey)));
  const hp = mk(tpl.baseHp, "hp"), atk = mk(tpl.baseAtk, "atk"), def = mk(tpl.baseDef, "def"), spd = mk(tpl.baseSpd, "spd");
  const artBonus = (k) => (artifact && artifact.kind === k ? artifact.amount : 0);
  const critChance = clamp(5 + pctFor("critChance") + artBonus("critChance"), 0, 90);
  const critDmg = 50 + pctFor("critDamage") + artBonus("critDamage");
  const dodge = clamp(5 + pctFor("dodge") + artBonus("dodge"), 0, 60);
  const startEnergy = artBonus("energyStart");
  return {
    uid: `${side}-${slot}-${tpl.id}`, tplId: tpl.id, name: namePrefix + tpl.name, icon: tpl.icon, role: tpl.role,
    side, slot, row, maxHp: hp, hp, baseAtk: atk, baseDef: def, baseSpd: spd, atk, def, spd,
    energy: startEnergy, energyMax: tpl.energyMax, gauge: Math.random() * 15, turnCount: 0,
    buffs: [], shield: 0, stunTurns: 0, alive: true, critChance, critDmg, dodge, artifact, usedLastStand: false,
    passives: tpl.passives, active: tpl.active, star, ascension,
  };
}

export function templatePower(t) { return t.baseHp / 8 + t.baseAtk * 1.8 + t.baseDef * 1.5 + t.baseSpd; }
export function computeCP(unit) { return Math.round(unit.hp / 8 + unit.atk * 1.8 + unit.def * 1.5 + unit.spd); }

export function assignRows(templates) {
  const sorted = [...templates].sort((a, b) => (b.baseDef * 1.4 + b.baseHp / 15) - (a.baseDef * 1.4 + a.baseHp / 15));
  const front = [], back = [];
  for (const t of sorted) (front.length < 3 ? front : back).push(t);
  return [...front, ...back];
}
export function sample(arr, n) {
  const pool = [...arr], out = [];
  while (out.length < n && pool.length) out.push(pool.splice(rnd(pool.length), 1)[0]);
  return out;
}

/* ============================== SIMULATION ============================== */
// Builds a full unit array for one PvP side from a formation descriptor:
// [{ heroId, star, ascension }, ...] (up to 6, in front/back slot order).
export function buildSideFromFormation(formation, side) {
  const templates = formation.map((f) => HEROES_BY_ID[f.heroId]).filter(Boolean);
  return templates.map((tpl, i) => buildUnit(tpl, side, i, {
    star: formation[i]?.star || 1,
    ascension: formation[i]?.ascension || 0,
  }));
}

export function simulateBattle(playerUnits, enemyUnits) {
  const battle = { units: [...playerUnits, ...enemyUnits] };
  const steps = [];
  let actions = 0;
  const MAX = 200;
  const snap = () => ({
    hp: Object.fromEntries(battle.units.map((u) => [u.uid, u.hp])),
    shield: Object.fromEntries(battle.units.map((u) => [u.uid, u.shield])),
    alive: Object.fromEntries(battle.units.map((u) => [u.uid, u.alive])),
    energy: Object.fromEntries(battle.units.map((u) => [u.uid, u.energy])),
  });
  while (sideList(battle, "player").some((u) => u.alive) && sideList(battle, "enemy").some((u) => u.alive) && actions < MAX) {
    const alive = battle.units.filter((u) => u.alive);
    const dt = Math.min(...alive.map((u) => (100 - u.gauge) / u.spd));
    alive.forEach((u) => { u.gauge += dt * u.spd; });
    const actors = alive.filter((u) => u.gauge >= 99.99).sort((a, b) => b.gauge - a.gauge || b.spd - a.spd);
    for (const actor of actors) {
      if (!actor.alive) continue;
      actor.gauge -= 100;
      const turnLog = [];
      doTurn(battle, actor, turnLog);
      actions++;
      steps.push({ actorUid: actor.uid, messages: turnLog, ...snap() });
      if (actions >= MAX) break;
      if (!sideList(battle, "player").some((u) => u.alive) || !sideList(battle, "enemy").some((u) => u.alive)) break;
    }
  }
  const pAlive = sideList(battle, "player").filter((u) => u.alive).length;
  const eAlive = sideList(battle, "enemy").filter((u) => u.alive).length;
  let winner;
  if (pAlive > 0 && eAlive === 0) winner = "player";
  else if (eAlive > 0 && pAlive === 0) winner = "enemy";
  else {
    const pHp = sideList(battle, "player").reduce((s, u) => s + u.hp, 0);
    const eHp = sideList(battle, "enemy").reduce((s, u) => s + u.hp, 0);
    winner = pHp >= eHp ? "player" : "enemy";
    steps.push({ actorUid: null, messages: ["⏱️ The battle drags on... judged by remaining strength."], ...snap() });
  }
  return { steps, winner, units: battle.units };
}
