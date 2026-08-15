/* ==========================================================================
   src/ui/render.js
   Minimal router: keeps track of the active screen key and re-renders the
   whole shell (topbar + sidenav + content) whenever AV.navigate() is called
   or AV.rerender() is invoked after a state mutation.
   ========================================================================== */

window.AV = window.AV || {};

(function (AV) {
  AV.activeScreen = "home";
  AV.activeScreenParams = {};

  AV.navigate = function navigate(key, params = {}) {
    AV.activeScreen = key;
    AV.activeScreenParams = params;
    AV.closeAllModals();
    AV.rerender();
  };

  AV.rerender = function rerender() {
    const app = document.getElementById("app");
    if (!app) return;
    app.innerHTML = "";

    const shell = AV.el("div", { class: "shell" }, [
      AV.renderSideNav(AV.activeScreen, (key) => AV.navigate(key)),
      AV.el("div", { class: "main-col" }, [
        AV.renderTopBar(),
        AV.el("div", { class: "content", id: "content" }),
      ]),
    ]);
    app.appendChild(shell);

    const content = document.getElementById("content");
    const renderer = AV.screens[AV.activeScreen] || AV.screens.home;
    renderer(content, AV.activeScreenParams);
  };

  AV.screens = {};
})(window.AV);
