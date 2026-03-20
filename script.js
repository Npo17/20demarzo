(function () {
  "use strict";

  var RAIN_CONTAINER_ID = "thumb-rain";
  var RAIN_CLASS = "thumb-drop";
  var RAIN_MAX = 20;
  var STORAGE_RAIN = "thumbonica-rain";
  var STORAGE_THEME = "thumbonica-theme";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  var toastHideTimer;
  var lastEasterMs = 0;

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

  function appendRainBurst(count, ttlMs) {
    var container = $(RAIN_CONTAINER_ID);
    if (!container || prefersReducedMotion) return;
    if (document.body.classList.contains("no-thumb-rain")) return;
    var frag = document.createDocumentFragment();
    var nodes = [];
    var n = Math.min(count, 24);
    for (var i = 0; i < n; i++) {
      var el = document.createElement("span");
      el.className = RAIN_CLASS + " thumb-drop--burst";
      el.setAttribute("aria-hidden", "true");
      el.textContent = "👍";
      el.style.left = Math.random() * 100 + "vw";
      el.style.fontSize = 12 + Math.random() * 16 + "px";
      el.style.animationDuration = 7 + Math.random() * 8 + "s";
      el.style.animationDelay = Math.random() * 2 + "s";
      frag.appendChild(el);
      nodes.push(el);
    }
    container.appendChild(frag);
    window.setTimeout(function () {
      nodes.forEach(function (node) {
        if (node.parentNode) node.parentNode.removeChild(node);
      });
    }, ttlMs);
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

  function showToast(message, ms) {
    var el = $("thumb-toast");
    if (!el) return;
    clearTimeout(toastHideTimer);
    el.textContent = message;
    el.classList.add("thumb-toast--show");
    toastHideTimer = window.setTimeout(function () {
      el.classList.remove("thumb-toast--show");
    }, ms || 2200);
  }

  function applyTheme(name) {
    var h = document.documentElement;
    h.classList.remove("theme-collapse", "theme-classic");
    if (name === "collapse") h.classList.add("theme-collapse");
    else if (name === "classic") h.classList.add("theme-classic");
    try {
      localStorage.setItem(STORAGE_THEME, name);
    } catch (e) {}
    document.querySelectorAll(".theme-chip").forEach(function (chip) {
      var on = chip.getAttribute("data-theme") === name;
      chip.setAttribute("aria-checked", on ? "true" : "false");
    });
  }

  function initTheme() {
    var saved = "lab";
    try {
      saved = localStorage.getItem(STORAGE_THEME) || "lab";
    } catch (e) {}
    if (saved !== "lab" && saved !== "collapse" && saved !== "classic") {
      saved = "lab";
    }
    applyTheme(saved);

    document.querySelectorAll(".theme-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var n = chip.getAttribute("data-theme");
        if (!n) return;
        applyTheme(n);
      });
    });
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function nextMarch20MidnightFrom(date) {
    var y = date.getFullYear();
    var t = new Date(y, 2, 20, 0, 0, 0, 0);
    if (date < t) return t;
    return new Date(y + 1, 2, 20, 0, 0, 0, 0);
  }

  function isMarch20Local(date) {
    return date.getMonth() === 2 && date.getDate() === 20;
  }

  function initCountdown() {
    var digits = $("countdown-digits");
    var sub = $("countdown-sub");
    var root = $("countdown-root");
    if (!digits) return;

    function renderCells(diffMs) {
      if (diffMs < 0) diffMs = 0;
      var s = Math.floor(diffMs / 1000);
      var days = Math.floor(s / 86400);
      s %= 86400;
      var h = Math.floor(s / 3600);
      s %= 3600;
      var m = Math.floor(s / 60);
      var sec = s % 60;
      digits.innerHTML =
        '<div class="cd-cell"><span class="cd-cell__n">' +
        days +
        '</span><span class="cd-cell__u">Días</span></div>' +
        '<div class="cd-cell"><span class="cd-cell__n">' +
        pad2(h) +
        '</span><span class="cd-cell__u">Horas</span></div>' +
        '<div class="cd-cell"><span class="cd-cell__n">' +
        pad2(m) +
        '</span><span class="cd-cell__u">Min</span></div>' +
        '<div class="cd-cell"><span class="cd-cell__n">' +
        pad2(sec) +
        '</span><span class="cd-cell__u">Seg</span></div>';
    }

    function tick() {
      var now = new Date();
      var target;
      if (isMarch20Local(now)) {
        if (root) root.classList.add("countdown-banner--today");
        target = new Date(now.getFullYear() + 1, 2, 20, 0, 0, 0, 0);
        if (sub) {
          sub.textContent =
            "Hoy es el 20 de marzo: colapso thumbónico local. Cuenta atrás hasta el próximo 20 de marzo (" +
            target.getFullYear() +
            "), medianoche.";
        }
      } else {
        if (root) root.classList.remove("countdown-banner--today");
        target = nextMarch20MidnightFrom(now);
        if (sub) {
          sub.textContent =
            "Objetivo: 20 de marzo de " +
            target.getFullYear() +
            " · 00:00 (hora de tu dispositivo).";
        }
      }
      renderCells(target - now);
    }

    tick();
    window.setInterval(tick, 1000);
  }

  function runForceCollapse() {
    var eq = $("equation-card");
    var box = eq ? eq.querySelector(".equation-box") : null;
    var res = $("resultado-final");

    if (eq) {
      eq.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
      });
    }

    if (box) {
      box.classList.remove("equation-flash");
      void box.offsetWidth;
      if (!prefersReducedMotion) {
        box.classList.add("equation-flash");
        window.setTimeout(function () {
          box.classList.remove("equation-flash");
        }, 1000);
      } else {
        box.style.boxShadow = "inset 0 0 28px rgba(125, 211, 252, 0.22)";
        box.style.borderColor = "rgba(125, 211, 252, 0.5)";
        window.setTimeout(function () {
          box.style.boxShadow = "";
          box.style.borderColor = "";
        }, 650);
      }
    }

    if (!prefersReducedMotion && eq) {
      eq.classList.remove("equation-rumble");
      void eq.offsetWidth;
      eq.classList.add("equation-rumble");
      window.setTimeout(function () {
        eq.classList.remove("equation-rumble");
      }, 680);
    }

    if (res) {
      res.classList.remove("quantum-pulse-strong", "collapse-highlight");
      void res.offsetWidth;
      res.classList.add("collapse-highlight");
      window.setTimeout(function () {
        res.classList.remove("collapse-highlight");
      }, 950);
      if (!prefersReducedMotion) {
        res.classList.add("quantum-pulse-strong");
        window.setTimeout(function () {
          res.classList.remove("quantum-pulse-strong");
        }, 1400);
      }
    }

    showToast("Colapso thumbónico confirmado.", 3000);

    if (!prefersReducedMotion) {
      appendRainBurst(12, 2800);
    }
  }

  function initForceCollapse() {
    document.querySelectorAll(".js-force-collapse").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        runForceCollapse();
      });
    });
  }

  function initResultEasterEgg() {
    var res = $("resultado-final");
    if (!res) return;
    var taps = 0;
    var tapTimer;
    res.addEventListener("click", function (e) {
      if (e.target.closest("button, a")) return;
      taps += 1;
      clearTimeout(tapTimer);
      tapTimer = window.setTimeout(function () {
        taps = 0;
      }, 2500);
      if (taps < 5) return;
      taps = 0;
      clearTimeout(tapTimer);
      var now = Date.now();
      if (now - lastEasterMs < 9000) return;
      lastEasterMs = now;
      showToast("Secuencia thumbónica reconocida. Máxima coherencia.", 2800);
      if (!prefersReducedMotion) {
        res.classList.add("easter-activated");
        appendRainBurst(16, 3400);
        window.setTimeout(function () {
          res.classList.remove("easter-activated");
        }, 4200);
      }
    });
  }

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
      el.addEventListener("click", function () {
        if (!window.matchMedia("(hover: hover)").matches) {
          showNear(el);
          scheduleHide();
        }
      });
    });
  }

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
    initTheme();
    initTooltips();
    initExperienceDock();
    initBoot();
    initForceCollapse();
    initCountdown();
    initResultEasterEgg();
  });
})();
