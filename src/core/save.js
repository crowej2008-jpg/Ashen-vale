/* ==========================================================================
   src/core/save.js — persistence layer (localStorage-backed).
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  const KEY = "ashenvale_save_v1";

  AV.save = function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(AV.state));
    } catch (e) {
      console.warn("Save failed", e);
    }
  };

  AV.load = function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return false;
      AV.state = JSON.parse(raw);
      return true;
    } catch (e) {
      console.warn("Load failed", e);
      return false;
    }
  };

  AV.hardReset = function hardReset() {
    localStorage.removeItem(KEY);
    AV.newGame();
  };

  AV.exportSave = function exportSave() {
    return JSON.stringify(AV.state, null, 2);
  };
})(window.AV);
