/* ==========================================================================
   src/ui/components/navbar.js — top currency bar + side navigation rail.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  const NAV_ITEMS = [
    { key: "home", label: "Home", icon: "⌂" },
    { key: "roster", label: "Roster", icon: "☰" },
    { key: "formation", label: "Formation", icon: "⬡" },
    { key: "summon", label: "Summon", icon: "✦" },
    { key: "campaign", label: "Campaign", icon: "⚔" },
    { key: "arena", label: "Arena", icon: "🏆" },
    { key: "endlessTower", label: "Endless Tower", icon: "▲" },
    { key: "bossTower", label: "Boss Tower", icon: "☠" },
    { key: "armorDungeon", label: "Armor Dungeon", icon: "🛡" },
    { key: "heroCreator", label: "Hero Creator", icon: "⚗" },
    { key: "sanctum", label: "Sanctum", icon: "◈" },
    { key: "awakening", label: "Awakening Hall", icon: "☾" },
    { key: "orbShop", label: "Orb Shop", icon: "●" },
    { key: "devMode", label: "Dev Mode", icon: "⚙" },
  ];

  AV.NAV_ITEMS = NAV_ITEMS;

  AV.renderTopBar = function renderTopBar() {
    const c = AV.state.currencies;
    const chip = (icon, val, label) => AV.el("div", { class: "res-chip", title: label }, [
      AV.el("span", { class: "res-icon" }, icon), AV.el("span", { class: "res-val" }, AV.fmt(val)),
    ]);
    return AV.el("div", { class: "topbar" }, [
      AV.el("div", { class: "topbar-brand" }, "ASHEN VALE"),
      AV.el("div", { class: "topbar-resources" }, [
        chip("🪙", c.gold, "Gold"),
        chip("📜", c.summoningScrolls, "Summoning Scrolls"),
        chip("🔷", c.artifactStones, "Artifact Summoning Stones"),
        chip("🎖", c.arenaTokens, "Arena Tokens"),
        chip("💎", c.radiantCrystals, "Radiant Crystals"),
        chip("🔶", c.divineStones, "Divine Stones"),
        chip("🧪", c.heroXpStones, "Hero XP Stones"),
      ]),
      AV.el("div", { class: "topbar-player" }, `Lv.${AV.state.player.level}`),
    ]);
  };

  AV.renderSideNav = function renderSideNav(activeKey, onNavigate) {
    return AV.el("nav", { class: "sidenav" }, NAV_ITEMS.map((item) =>
      AV.el("button", {
        class: `sidenav-item ${item.key === activeKey ? "active" : ""}`,
        onclick: () => onNavigate(item.key),
      }, [AV.el("span", { class: "sidenav-icon" }, item.icon), AV.el("span", {}, item.label)])
    ));
  };
})(window.AV);
