/* ==========================================================================
   src/ui/components/battleResult.js — shared post-battle summary modal.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.showBattleResult = function showBattleResult(result, rewardsText) {
    const won = result.winnerSide === "player";
    const wrap = AV.el("div", { class: "popup-box" }, [
      AV.el("h3", {}, won ? "Victory!" : result.winnerSide === "draw" ? "Draw" : "Defeat"),
      rewardsText ? AV.el("div", { class: "empty-note" }, rewardsText) : null,
      AV.el("div", { class: "battle-log" }, result.log.slice(-40).map((l) =>
        AV.el("div", { class: `log-item side-${l.side}` }, `R${l.round} · ${l.text}`)
      )),
    ]);
    AV.openModal(wrap, { wide: true });
  };
})(window.AV);
