/* ==========================================================================
   src/ui/screens/arenaScreen.js
   Lets the player preview an opponent's individual heroes before
   committing to fight, per spec.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  let currentOpponent = null;

  AV.screens.arena = function arenaScreen(container) {
    if (!currentOpponent) currentOpponent = AV.generateArenaOpponent();
    const rank = AV.currentArenaRank();

    container.appendChild(AV.el("div", { class: "screen" }, [
      AV.el("h1", {}, "PvP Arena"),
      AV.el("div", { class: "empty-note" }, `Elo ${AV.state.player.elo} · Rank: ${rank.name} (+${rank.tokens} Arena Tokens per win) · Win +50 Elo / Lose -10 Elo.`),
      AV.el("div", { class: "panel" }, [
        AV.el("h3", {}, `Opponent: ${currentOpponent.name} (Elo ${currentOpponent.elo})`),
        AV.el("div", { class: "hero-grid" }, currentOpponent.heroes.map((h) =>
          AV.el("div", { class: "hero-card small", style: `--grade-color:${AV.GRADE_COLORS[h.template.grade]}` }, [
            AV.el("div", { class: "hero-card-grade" }, `★${h.template.grade}`),
            AV.el("div", { class: "hero-card-portrait" }, AV.CLASS_ICONS[h.template.class]),
            AV.el("div", { class: "hero-card-name" }, h.template.name),
            AV.el("div", { class: "hero-card-sub" }, `HP ${AV.fmt(h.previewStats.hp)} · ATK ${AV.fmt(h.previewStats.attack)}`),
          ])
        )),
        AV.el("div", { class: "hd-actions" }, [
          AV.el("button", { class: "btn", onclick: () => {
            const r = AV.fightArenaOpponent(currentOpponent);
            if (r.error) { AV.toast(r.error, true); return; }
            currentOpponent = null;
            AV.rerender();
            AV.showBattleResult(r, r.winnerSide === "player" ? `Elo now ${r.eloAfter} (${r.rank.name})` : `Elo now ${r.eloAfter}`);
          } }, "Fight"),
          AV.el("button", { class: "btn btn-small", onclick: () => { currentOpponent = AV.generateArenaOpponent(); AV.rerender(); } }, "Re-scout Opponent"),
        ]),
      ]),
    ]));
  };
})(window.AV);
