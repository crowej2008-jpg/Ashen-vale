/* ==========================================================================
   src/ui/screens/heroDetails.js
   The Hero Details screen/modal: full stat menu, evolution/ascension,
   leveling, and popups for Armor and Artifacts (per spec, these are
   popups within hero details rather than shown inline).
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  function statRow(label, value) {
    return AV.el("div", { class: "stat-row" }, [AV.el("span", { class: "stat-label" }, label), AV.el("span", { class: "stat-value" }, value)]);
  }

  AV.openHeroDetails = function openHeroDetails(instanceId) {
    const render = () => {
      const inst = AV.state.heroInstances[instanceId];
      if (!inst) { AV.closeAllModals(); return; }
      const tpl = AV.template(inst.templateId);
      const stats = AV.computeHeroStats(inst);
      const cp = AV.computeCP(inst);

      const wrap = AV.el("div", { class: "hero-details" });

      wrap.appendChild(AV.el("div", { class: "hd-header", style: `--grade-color:${AV.GRADE_COLORS[tpl.grade]}` }, [
        AV.el("div", { class: "hd-portrait" }, AV.CLASS_ICONS[tpl.class]),
        AV.el("div", {}, [
          AV.el("h2", {}, tpl.name),
          AV.el("div", { class: "hd-sub" }, `Grade ${tpl.grade} · ${tpl.class} · ${inst.stars}★${inst.ascensionRank ? ` +${inst.ascensionRank} Ascension` : ""} · Lv.${inst.level}/${AV.HERO_LEVEL_CAP}`),
          AV.el("div", { class: "hd-cp" }, `CP ${AV.fmt(cp)}`),
        ]),
      ]));

      // ---- Full stat menu ----
      const statBox = AV.el("div", { class: "hd-section" }, [
        AV.el("h3", {}, "Stats"),
        AV.el("div", { class: "stat-grid" }, [
          statRow("HP", AV.fmt(stats.hp)),
          statRow("Attack", AV.fmt(stats.attack)),
          statRow("Defense", AV.fmt(stats.defense)),
          statRow("Speed", stats.speed),
          statRow("Crit Chance", AV.pct(stats.critChance)),
          statRow("Crit Damage", AV.pct(stats.critDamage)),
          statRow("Block Chance", AV.pct(stats.blockChance)),
          statRow("Block Strength", AV.pct(stats.blockStrength)),
          statRow("Dodge Chance", AV.pct(stats.dodgeChance)),
          statRow("Energy Req.", `${stats.energyReq}`),
          statRow("Energy/Basic Atk", `${stats.basicEnergyGain}`),
        ]),
      ]);
      wrap.appendChild(statBox);

      // ---- Leveling ----
      const xpNeed = inst.level < AV.HERO_LEVEL_CAP ? AV.xpToNextHeroLevel(inst.level) : 0;
      const levelBox = AV.el("div", { class: "hd-section" }, [
        AV.el("h3", {}, "Leveling"),
        AV.el("div", {}, inst.level >= AV.HERO_LEVEL_CAP ? "Max level reached." : `XP ${inst.xp}/${xpNeed}`),
        AV.el("div", { class: "hd-actions" }, [
          btn(`Use 10 Hero XP Stones (have ${AV.state.currencies.heroXpStones})`, () => {
            const r = AV.levelUpHeroWithStones(instanceId, 10);
            flash(r);
          }, inst.level >= AV.HERO_LEVEL_CAP),
        ]),
      ]);
      wrap.appendChild(levelBox);

      // ---- Evolution / Ascension ----
      const evoBox = AV.el("div", { class: "hd-section" });
      evoBox.appendChild(AV.el("h3", {}, "Evolution"));
      if (inst.stars < 10) {
        const cost = AV.nextEvolutionCost(instanceId);
        const fodder = AV.availableFodder(instanceId).length;
        evoBox.appendChild(AV.el("div", {}, `Star ${inst.stars} → ${inst.stars + 1}: needs ${cost} spare cop${cost > 1 ? "ies" : "y"} (have ${fodder}).`));
        evoBox.appendChild(AV.el("div", { class: "hd-actions" }, [
          btn("Evolve", () => flash(AV.evolveHero(instanceId)), fodder < cost),
        ]));
      } else {
        const req = AV.nextAscensionRequirement(instanceId);
        const sacrifices = AV.eligibleSacrifices(instanceId, req.requiredSacrificeStar);
        evoBox.appendChild(AV.el("div", {}, `Ascension Rank ${inst.ascensionRank} → ${req.rank}: needs ${req.copyCost} spare copies + a ${req.requiredSacrificeStar}★ sacrifice hero.`));
        const select = AV.el("select", { class: "hd-select" }, [
          AV.el("option", { value: "" }, sacrifices.length ? "Choose a sacrifice hero…" : "No eligible sacrifice heroes"),
          ...sacrifices.map((s) => AV.el("option", { value: s.id }, `${AV.template(s.templateId).name} (${s.stars}★)`)),
        ]);
        evoBox.appendChild(select);
        evoBox.appendChild(AV.el("div", { class: "hd-actions" }, [
          btn("Ascend", () => {
            if (!select.value) { flash({ error: "Select a sacrifice hero first." }); return; }
            flash(AV.ascendHero(instanceId, select.value));
          }, !sacrifices.length),
        ]));
      }
      wrap.appendChild(evoBox);

      // ---- Passives ----
      const passiveBox = AV.el("div", { class: "hd-section" }, [
        AV.el("h3", {}, "Passives"),
        ...tpl.passives.map((p) => AV.el("div", { class: `passive-row ${inst.stars >= p.unlockEvolution ? "unlocked" : "locked"}` }, [
          AV.el("strong", {}, `P${p.tier}. ${p.name}`),
          AV.el("span", {}, ` — ${p.description}${inst.stars >= p.unlockEvolution ? "" : ` (unlocks at ${p.unlockEvolution}★)`}`),
        ])),
      ]);
      wrap.appendChild(passiveBox);

      // ---- Armor / Artifact / Orbs popups ----
      const equipRow = AV.el("div", { class: "hd-section hd-equip-row" }, [
        AV.el("h3", {}, "Equipment"),
        AV.el("div", { class: "hd-actions" }, [
          btn("Armor", () => AV.openArmorPopup(instanceId, () => { AV.rerender(); rerenderModal(); })),
          btn("Artifact", () => AV.openArtifactPopup(instanceId, () => { AV.rerender(); rerenderModal(); })),
          btn("Orbs", () => AV.openOrbPopup(instanceId, () => { AV.rerender(); rerenderModal(); })),
        ]),
      ]);
      wrap.appendChild(equipRow);

      // ---- Awakening ----
      const awkBox = AV.el("div", { class: "hd-section" }, [
        AV.el("h3", {}, "Awakening"),
        AV.el("div", {}, AV.isAwakeningHallUnlocked()
          ? `Tier: ${inst.awakeningTier >= 0 ? AV.AWAKENING_TIERS[inst.awakeningTier] : "None"}`
          : `Unlocks at player level ${AV.AWAKENING_UNLOCK_PLAYER_LEVEL}.`),
        inst.awakeningTier < AV.AWAKENING_TIERS.length - 1 ? AV.el("div", { class: "hd-actions" }, [
          btn(`Awaken (${AV.awakeningCrystalCost(inst.awakeningTier)} 💎)`, () => flash(AV.awakenHero(instanceId)), !AV.isAwakeningHallUnlocked()),
        ]) : null,
      ]);
      wrap.appendChild(awkBox);

      // ---- Disassemble ----
      wrap.appendChild(AV.el("div", { class: "hd-section" }, [
        AV.el("h3", {}, "Disassembly"),
        AV.el("div", { class: "hd-actions" }, [
          btn("Disassemble this copy → Hero Souls", () => {
            const r = AV.disassembleHero(instanceId);
            if (r.error) { flash(r); return; }
            AV.closeAllModals();
            AV.rerender();
          }, false, true),
        ]),
      ]));

      function btn(label, onClick, disabled, danger) {
        return AV.el("button", { class: `btn ${danger ? "btn-danger" : ""}`, disabled: disabled ? "true" : undefined, onclick: onClick }, label);
      }
      function flash(result) {
        if (result && result.error) { AV.toast(result.error, true); return; }
        AV.toast("Done.");
        AV.rerender();
        rerenderModal();
      }

      return wrap;
    };

    let closeFn = null;
    function rerenderModal() {
      if (closeFn) closeFn();
      closeFn = AV.openModal(render(), { wide: true, onClose: () => { closeFn = null; } });
    }
    rerenderModal();
  };
})(window.AV);
