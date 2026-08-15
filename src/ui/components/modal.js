/* ==========================================================================
   src/ui/components/modal.js — a simple stacked modal/popup system.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  let root = null;

  function ensureRoot() {
    if (!root) {
      root = document.getElementById("av-modal-root");
    }
    return root;
  }

  AV.openModal = function openModal(contentNode, opts = {}) {
    const r = ensureRoot();
    const overlay = AV.el("div", { class: "av-modal-overlay" });
    const box = AV.el("div", { class: `av-modal-box ${opts.wide ? "av-modal-wide" : ""}` });
    const closeBtn = AV.el("button", { class: "av-modal-close", onclick: () => close() }, "✕");
    box.appendChild(closeBtn);
    box.appendChild(contentNode);
    overlay.appendChild(box);
    overlay.addEventListener("click", (e) => { if (e.target === overlay && !opts.pinned) close(); });
    function close() {
      overlay.remove();
      if (opts.onClose) opts.onClose();
    }
    r.appendChild(overlay);
    return close;
  };

  AV.closeAllModals = function closeAllModals() {
    ensureRoot().innerHTML = "";
  };
})(window.AV);
