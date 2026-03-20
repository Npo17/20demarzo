(function () {
  "use strict";

  var RAIN_CONTAINER_ID = "thumb-rain";
  var RAIN_CLASS = "thumb-drop";
  var RAIN_MAX = 20;
  var STORAGE_RAIN = "thumbonica-rain";
  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function $(id) {
    return document.getElementById(id);
  }

  function loadRainPreference() {
    try {
      var v = localStorage.getItem(STORAGE_RAIN);
      if (v === "0") return false;
      if (v === "1") return true;
    } catch (e) {}
    return true;
  }

  function saveRainPreference(on) {
    try {
      localStorage.setItem(STORAGE_RAIN, on ? "1" : "0");
    } catch (e) {}
  }

  function buildRain(container, enabled) {
    container.textContent = "";
    if (!enabled || prefersReducedMotion) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < RAIN_MAX; i++) {
      var el = document.createElement("span");
      el.className = RAIN_CLASS;
      el.setAttribute("aria-hidden", "true");
      el.textContent = "👍";
      el.style.left = Math.random() * 100 + "vw";
      el.style.fontSize = 13 + Math.random() * 14 + "px";
      el.style.opacity = String(0.06 + Math.random() * 0.1);
      el.style.animationDuration = 14 + Math.random() * 14 + "s";
      el.style.animationDelay = Math.random() * 8 + "s";
      frag.appendChild(el);
    }
    container.appendChild(frag);
  }

  function setRainUI(on) {
    if (prefersReducedMotion) on = false;
    var container = $(RAIN_CONTAINER_ID);
    var btn = $("toggle-rain-btn");
    if (container) {
      buildRain(container, on);
    }
    if (btn) {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.textContent = on ? "Desactivar lluvia de 👍" : "Activar lluvia de 👍";
    }
    document.body.classList.toggle("no-thumb-rain", !on);
    saveRainPreference(on);
  }

  /* Floating tooltip (desktop) + tap (mobile) */
  function initTooltips() {
    var tip = $("thumb-tooltip");
    if (!tip) return;
    var targets = document.querySelectorAll("[data-thumb-hint]");
    var hideTimer;

    function showNear(el, clientX, clientY) {
      var text = el.getAttribute("data-thumb-hint") || "20 de marzo";
      tip.textContent = text;
      tip.classList.add("thumb-tooltip--visible");
      var x = clientX;
      var y = clientY;
      if (x === undefined || y === undefined) {
        var r = el.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top;
      }
      tip.style.left = Math.min(window.innerWidth - 12, Math.max(12, x)) + "px";
      tip.style.top = Math.max(12, y - 8) + "px";
      tip.style.transform = "translate(-50%, -100%)";
    }

    function scheduleHide() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () {
        tip.classList.remove("thumb-tooltip--visible");
      }, 2200);
    }

    targets.forEach(function (el) {
      el.addEventListener("mouseenter", function (e) {
        if (window.matchMedia("(hover: hover)").matches) {
          showNear(el, e.clientX, e.clientY);
        }
      });
      el.addEventListener("mousemove", function (e) {
        if (tip.classList.contains("thumb-tooltip--visible")) {
          showNear(el, e.clientX, e.clientY);
        }
      });
      el.addEventListener("mouseleave", function () {
        tip.classList.remove("thumb-tooltip--visible");
        clearTimeout(hideTimer);
      });
      el.addEventListener("focusin", function () {
        var r = el.getBoundingClientRect();
        showNear(el, r.left + r.width / 2, r.top);
      });
      el.addEventListener("focusout", function () {
        tip.classList.remove("thumb-tooltip--visible");
        clearTimeout(hideTimer);
      });
      el.addEventListener("click", function (e) {
        if (!window.matchMedia("(hover: hover)").matches) {
          showNear(el);
          scheduleHide();
        }
      });
    });
  }

  /* Experience FAB + panel */
  function initExperienceDock() {
    var fab = $("experience-fab");
    var panel = $("experience-panel");
    if (!fab || !panel) return;

    function close() {
      fab.setAttribute("aria-expanded", "false");
      panel.hidden = true;
    }

    function open() {
      fab.setAttribute("aria-expanded", "true");
      panel.hidden = false;
    }

    fab.addEventListener("click", function () {
      var exp = fab.getAttribute("aria-expanded") === "true";
      if (exp) close();
      else open();
    });

    document.addEventListener("click", function (e) {
      if (!panel.hidden && !fab.contains(e.target) && !panel.contains(e.target)) {
        close();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    var wantRain = !prefersReducedMotion && loadRainPreference();
    setRainUI(wantRain);

    var toggleRain = $("toggle-rain-btn");
    if (toggleRain) {
      if (prefersReducedMotion) {
        toggleRain.disabled = true;
        toggleRain.title = "Animación desactivada por preferencias del sistema";
      }
      toggleRain.addEventListener("click", function () {
        var on = document.body.classList.contains("no-thumb-rain");
        setRainUI(on);
      });
    }

    var hl = $("toggle-march-btn");
    if (hl) {
      hl.addEventListener("click", function () {
        document.body.classList.toggle("state-march-glow");
        hl.setAttribute(
          "aria-pressed",
          document.body.classList.contains("state-march-glow")
            ? "true"
            : "false"
        );
      });
    }

    var focusResult = $("focus-result-btn");
    if (focusResult) {
      focusResult.addEventListener("click", function () {
        var el = $("resultado-final");
        if (el) {
          close();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.remove("quantum-pulse");
          void el.offsetWidth;
          el.classList.add("quantum-pulse");
        }
      });
    }
  }

  /* Boot overlay */
  function initBoot() {
    var overlay = $("boot-overlay");
    var reduce =
      prefersReducedMotion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!overlay || reduce) {
      if (overlay) overlay.classList.add("boot-overlay--skip");
      return;
    }
    var done = function () {
      overlay.classList.add("boot-overlay--done");
      overlay.addEventListener(
        "transitionend",
        function te() {
          overlay.removeEventListener("transitionend", te);
          overlay.setAttribute("aria-hidden", "true");
          overlay.style.pointerEvents = "none";
        },
        { once: true }
      );
    };
    window.setTimeout(done, 1400);
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTooltips();
    initExperienceDock();
    initBoot();
  });
})();
