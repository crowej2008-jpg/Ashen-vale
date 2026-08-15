/* ==========================================================================
   src/ui/screens/towerScreens.js
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.screens.endlessTower = function endlessTowerScreen(container) {
    const floor = AV.state.endlessTower.highestFloor;
    container.appendChild(AV.el("div", { class: "screen" }, [
      AV.el("h1", {}, "Endless Tower"),
      AV.el("div", { class: "empty-note" }, "No ceiling — floors keep scaling forever against tough opponents."),
      AV.el("div", { class: "panel" }, [
        AV.el("h3", {}, `Highest Floor Cleared: ${floor}`),
        AV.el("div", {}, `Next: Floor ${floor + 1}`),
        AV.el("button", { class: "btn", onclick: () => {
          const r = AV.climbEndlessTower();
          if (r.error) { AV.toast(r.error, true); return; }
          AV.rerender();
          AV.showBattleResult(r, r.winnerSide === "player" ? `Cleared floor ${r.floor}!` : "Try strengthening your formation.");
        } }, "Climb"),
      ]),
    ]));
  };

  AV.screens.bossTower = function bossTowerScreen(container) {
    const floor = AV.state.bossTower.highestFloor;
    container.appendChild(AV.el("div", { class: "screen" }, [
      AV.el("h1", {}, "Boss Tower"),
      AV.el("div", { class: "empty-note" }, "Boss enemies use different heroes at boosted stats versus their normal Campaign versions." ),
      AV.el("div", { class: "panel" }, [
        AV.el("h3", {}, `Highest Floor Cleared: ${floor}`),
        AV.el("div", {}, `Next: Floor ${floor + 1}`),
        AV.el("button", { class: "btn", onclick: () => {
          const r = AV.fightBossTowerFloor();
          if (r.error) { AV.toast(r.error, true); return; }
          AV.rerender();
          AV.showBattleResult(r, r.winnerSide === "player" ? `Defeated the floor ${r.floor} boss!` : "The boss proved too strong.");
        } }, "Challenge Boss"),
      ]),
    ]));
  };
})(window.AV);
