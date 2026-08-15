/* ==========================================================================
   src/ui/components/toast.js — brief bottom-corner notifications.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.toast = function toast(message, isError) {
    const host = document.getElementById("av-toast-root");
    if (!host) return;
    const node = AV.el("div", { class: `toast ${isError ? "toast-error" : ""}` }, message);
    host.appendChild(node);
    setTimeout(() => node.classList.add("show"), 10);
    setTimeout(() => { node.classList.remove("show"); setTimeout(() => node.remove(), 300); }, 2600);
  };
})(window.AV);
