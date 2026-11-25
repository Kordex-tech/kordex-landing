// KORDEX system v2: light / dark. Light by default; the choice is remembered under the same key as on the
// current site ("kordex-theme"). Loaded in <head> without defer so the page is drawn in the chosen theme.
(function () {
  var root = document.documentElement, KEY = "kordex-theme";
  try { var saved = localStorage.getItem(KEY); if (saved === "dark" || saved === "light") root.dataset.theme = saved; } catch (e) {}
  var L = root.lang === "sl" ? { dark: "Temna tema", light: "Svetla tema" }
        : root.lang === "ru" ? { dark: "Тёмная тема", light: "Светлая тема" }
        : { dark: "Dark theme", light: "Light theme" };
  document.addEventListener("DOMContentLoaded", function () {
    var b = document.querySelector(".theme");
    if (!b) return;
    function sync() {
      var d = root.dataset.theme === "dark";
      b.setAttribute("aria-pressed", d ? "true" : "false");
      b.setAttribute("aria-label", d ? L.light : L.dark);
    }
    b.addEventListener("click", function () {
      root.classList.add("theme-anim");
      root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
      try { localStorage.setItem(KEY, root.dataset.theme); } catch (e) {}
      sync();
      setTimeout(function () { root.classList.remove("theme-anim"); }, 320);
    });
    sync();
    b.hidden = false;
  });
})();
