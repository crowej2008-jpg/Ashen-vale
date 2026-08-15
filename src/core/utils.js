/* ==========================================================================
   src/core/utils.js — small shared helpers used across systems and UI.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.uid = function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  };

  AV.clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  AV.randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  AV.pickWeighted = function pickWeighted(entries) {
    // entries: [{item, weight}]
    const total = entries.reduce((s, e) => s + e.weight, 0);
    let r = Math.random() * total;
    for (const e of entries) {
      if (r < e.weight) return e.item;
      r -= e.weight;
    }
    return entries[entries.length - 1].item;
  };

  AV.fmt = function fmt(n) {
    if (n == null) return "0";
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + "K";
    return Math.round(n).toString();
  };

  AV.pct = (v) => `${Math.round(v * 100)}%`;

  AV.el = function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== null) node.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null || c === false) return;
      const isNode = c instanceof Node;
      node.appendChild(isNode ? c : document.createTextNode(String(c)));
    });
    return node;
  };

  AV.GRADE_COLORS = { 1: "#8d8f96", 2: "#5fae6b", 3: "#4a90c4", 4: "#a568d6", 5: "#e0a83a" };
  AV.CLASS_ICONS = { Warrior: "⚔", Tank: "🛡", Mage: "✦", Assassin: "🗡", Support: "✚", Ranger: "➶" };
})(window.AV);
