/* ==========================================================================
   src/ui/screens/home.js — dashboard overview.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.screens.home = function homeScreen(container) {
    const p = AV.state.player;
    const xpNeed = AV.xpToNextPlayerLevel(p.level);
    const nextLevelBtn = document.createElement("div");

    container.appendChild(AV.el("div", { class: "screen home-screen" }, [
      AV.el("h1", {}, "Welcome back, Warden."),
      AV.el("div", { class: "home-grid" }, [
        AV.el("div", { class: "panel" }, [
          AV.el("h3", {}, "Player"),
          AV.el("div", {}, `Level ${p.level} / ${AV.PLAYER_LEVEL_CAP}`),
          AV.el("div", { class: "progress-bar" }, [AV.el("div", { class: "progress-fill", style: `width:${(p.xp / xpNeed) * 100}%` })]),
          AV.el("div", { class: "empty-note" }, `${p.xp} / ${xpNeed} XP`),
          AV.el("div", {}, `Arena Elo: ${p.elo} (${AV.currentArenaRank().name})`),
        ]),
        AV.el("div", { class: "panel" }, [
          AV.el("h3", {}, "Progress"),
          AV.el("div", {}, `Campaign: Level ${AV.state.campaign.highestLevelCleared}/${AV.CAMPAIGN_MAX_LEVEL}`),
          AV.el("div", {}, `Endless Tower: Floor ${AV.state.endlessTower.highestFloor}`),
          AV.el("div", {}, `Boss Tower: Floor ${AV.state.bossTower.highestFloor}`),
          AV.el("div", {}, `Roster: ${Object.keys(AV.state.heroInstances).length} / ${AV.ROSTER_CAP} heroes`),
        ]),
        AV.el("div", { class: "panel" }, [
          AV.el("h3", {}, "Formation"),
          AV.el("div", { class: "mini-formation" }, AV.state.formation.map((id) => {
            const inst = id ? AV.state.heroInstances[id] : null;
            return AV.el("div", { class: "mini-slot" }, inst ? AV.CLASS_ICONS[AV.template(inst.templateId).class] : "—");
          })),
          AV.el("button", { class: "btn", onclick: () => AV.navigate("formation") }, "Edit Formation"),
        ]),
      ]),
      AV.el("div", { class: "panel" }, [
        AV.el("h3", {}, "Recent Activity"),
        AV.el("div", { class: "log-list" }, AV.state.log.length
          ? AV.state.log.slice(0, 10).map((l) => AV.el("div", { class: "log-item" }, l.msg))
          : [AV.el("div", { class: "empty-note" }, "Nothing yet — go fight something.")]),
      ]),
    ]));
  };
})(window.AV);
