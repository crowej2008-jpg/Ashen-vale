/* ==========================================================================
   src/main.js — application entry point.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  document.addEventListener("DOMContentLoaded", () => {
    const loaded = AV.load();
    if (!loaded || !AV.state) {
      AV.newGame();
    }
    AV.refreshOrbShopIfNeeded();
    AV.navigate("home");
  });
})(window.AV);
