(function () {
  "use strict";

  var RAIN_CONTAINER_ID = "thumb-rain";
  var RAIN_CLASS = "thumb-drop";
  var RAIN_MAX = 20;
  var STORAGE_RAIN = "thumbonica-rain";
  var STORAGE_THEME = "thumbonica-theme";
  var STORAGE_SOUND = "thumbonica-sound";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  var toastHideTimer;
  var lastResultEasterMs = 0;
  var lastTitleEggMs = 0;
  var entryChimePlayed = false;
  var audioCtxSingleton = null;

  function $(id) {
    return document.getElementById(id);
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
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

  function loadSoundPreference() {
    if (prefersReducedMotion) return false;
    try {
      var v = localStorage.getItem(STORAGE_SOUND);
      if (v === "0") return false;
      if (v === "1") return true;
    } catch (e) {}
    return true;
  }

  function saveSoundPreference(on) {
    try {
      localStorage.setItem(STORAGE_SOUND, on ? "1" : "0");
    } catch (e) {}
  }

  function canPlaySound() {
    return !prefersReducedMotion && loadSoundPreference();
  }

  function getAudioContext() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtxSingleton) audioCtxSingleton = new AC();
    return audioCtxSingleton;
  }

  function playEntryChimeInner(ctx) {
    var t0 = ctx.currentTime;
    var master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(0.042, t0 + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
    master.connect(ctx.destination);

    var o1 = ctx.createOscillator();
    o1.type = "sine";
    o1.frequency.setValueAtTime(523.25, t0);
    o1.frequency.exponentialRampToValueAtTime(783.99, t0 + 0.11);
    o1.connect(master);
    o1.start(t0);
    o1.stop(t0 + 0.18);

    var o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.setValueAtTime(1046.5, t0 + 0.07);
    o2.connect(master);
    o2.start(t0 + 0.07);
    o2.stop(t0 + 0.24);
  }

  function ensureEntryChime() {
    if (!canPlaySound() || entryChimePlayed) return;
    var ctx = getAudioContext();
    if (!ctx) return;
    function run() {
      if (entryChimePlayed) return;
      try {
        playEntryChimeInner(ctx);
        entryChimePlayed = true;
      } catch (e) {}
    }
    try {
      if (ctx.state === "suspended") {
        ctx.resume().then(run).catch(function () {});
      } else {
        run();
      }
    } catch (e) {}
  }

  function playCollapseChime() {
    if (!canPlaySound()) return;
    var ctx = getAudioContext();
    if (!ctx) return;
    try {
      if (ctx.state === "suspended") ctx.resume();
      var t0 = ctx.currentTime;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.055, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
      g.connect(ctx.destination);
      var o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(196, t0);
      o.frequency.exponentialRampToValueAtTime(392, t0 + 0.08);
      o.connect(g);
      o.start(t0);
      o.stop(t0 + 0.16);
    } catch (e) {}
  }

  function bindDeferredEntryChime() {
    if (!canPlaySound()) return;
    var once = function () {
      ensureEntryChime();
      document.removeEventListener("pointerdown", once, true);
      document.removeEventListener("keydown", onceKey, true);
    };
    function onceKey(e) {
      if (e.key === "Enter" || e.key === " ") once();
    }
    document.addEventListener("pointerdown", once, true);
    document.addEventListener("keydown", onceKey, true);
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
    var n = Math.min(count, 28);
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

  function spawnCollapseParticles() {
    var root = $("collapse-particle-root");
    if (!root || prefersReducedMotion) return;
    var cx = window.innerWidth / 2;
    var cy = window.innerHeight * 0.42;
    var n = 40;
    for (var i = 0; i < n; i++) {
      (function (idx) {
        var el = document.createElement("span");
        el.className = "collapse-particle";
        el.setAttribute("aria-hidden", "true");
        el.textContent = "👍";
        el.style.left = cx + "px";
        el.style.top = cy + "px";
        var ang = (Math.PI * 2 * idx) / n + Math.random() * 0.4;
        var dist = 100 + Math.random() * 320;
        el.style.setProperty("--tx", Math.cos(ang) * dist + "px");
        el.style.setProperty("--ty", Math.sin(ang) * dist + "px");
        el.style.animationDuration = 0.75 + Math.random() * 0.45 + "s";
        root.appendChild(el);
        window.setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 1600);
      })(i);
    }
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

  function setSoundUI() {
    var btn = $("toggle-sound-btn");
    if (!btn) return;
    if (prefersReducedMotion) {
      btn.disabled = true;
      btn.setAttribute("aria-pressed", "false");
      btn.textContent = "Sonido no disponible (accesibilidad)";
      return;
    }
    var on = loadSoundPreference();
    btn.disabled = false;
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.textContent = on ? "Sonido de ingreso activado" : "Activar sonido de ingreso";
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

  function copyToClipboard(text, okMsg, errMsg) {
    function done(ok) {
      showToast(ok ? okMsg : errMsg || "No se pudo copiar.");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        done(true);
      }).catch(function () {
        fallback();
      });
      return;
    }
    fallback();
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        done(document.execCommand("copy"));
      } catch (err) {
        done(false);
      }
      document.body.removeChild(ta);
    }
  }

  var EQ_FRAGMENTS = [
    "lim_{ε→0⁺} [ ε⁻¹ · Z_👍[J; g, Φ] · Γ_RG^(4)(p₁,…,p₄) ]",
    "∑_{n=0}^∞ ((-1)^n / (n+👍)!) · ζ_Hodge(Δ_👍; -n/2)",
    "∫_{𝒞_Ward} (δS_eff/δΦ) ∧ exp[ i ∫ Tr(F∧*F) + S_BRST(ghost) ]",
    "det_👍(iD̸ - m_👍) · Pf(𝒜_👍) · ∏_{k∈ℤ} (1 - q^k)^{dim H^k}",
    "Res_{s=👍} [ Γ(s) · ζ_det(□_g + R/6 - λ_👍) ]",
    "P exp ∮_{∂Σ_👍} (A_μ dx^μ + ω_spin)",
    "⟨0| T{𝒪_👍(x₁)⋯𝒪_👍(x_n)} |0⟩_{ren, MS̅}",
    "∫_{ℳ_moduli} [dτ ∧ dτ̄] · |η(τ)|^{-4} · Z_worldsheet^👍",
    "Tr_{𝒮_👍} ρ_thermal · log ρ_thermal  +  S_EE(Σ_A|Σ_B)",
    "∏_{ν∈Spec(𝒟_👍)} (1 + e^{-β(ν-μ)})^{m(ν)}",
    "Hol_{∇_👍}(𝒫) · exp[ -∫_0^1 (½|ẋ|² + V_👍(x)) ds ]",
    "∑_{σ∈S_N} sgn(σ) · ⟨ψ_👍| U^⊗N |ψ_{σ(👍)}⟩",
    "∫ dμ_Haar(U) · χ_λ(U) · Tr(U^† Π_👍 U)",
    "δ( BRST, 𝒬_👍 ) · ∫ 𝒟[ghost] 𝒟[antighost] e^{i S_FP}",
    "lim_{Λ→∞} [ ∫_{|p|<Λ} d^dp/(2π)^d · |ℳ_👍|² ]^{1/2}",
    "∂_β g^i + β^i_RG(g) = 0  ⇒  fixed point g^*_👍",
    "⟨👍| e^{-tH_👍} |👍⟩ / Z_canonical(β)",
    "∫_{B_👍} e^{-S_E[φ]} 𝒟φ  ·  [det'(-□ + U'')]^(-1/2)",
    "∑_{graphs Γ} (1/|Aut Γ|) · ∏_{edges} propagator_👍",
    "∧^{top} T^*𝒳_👍 ⊗ K_𝒳^{-1/2}  ⊗  ℒ_👍",
    "W[J] = ℏ log Z[J]  ;  δ^n W/δJ^n|_{J=0} = G_n^connected",
    "∮_{|z|=1} dz/(2πi) · (log Z_👍(z))/(z-1)²",
    "‖ψ‖_{𝒦_👍}² := ∫ |∇ψ|² + V_👍|ψ|²",
    "Ξ_👍(s) := ∑_n λ_n^{-s}  ,  meromorphic en s∈ℂ",
    "Cohom^*(𝒞_E, δ_Q) ≅  reps físicas thumbónicas",
    "∫_{G_👍} dg · f(g) · Δ_Haar(g)^{-1}",
    "lim_{N→∞} (1/N) log Tr_N exp(-β H_👍^{(N)})",
  ];

  var EQ_MIDDLES = [
    " · ",
    " + ",
    " − ",
    " ⊗ ",
    " ⋈ ",
    " ∘ ",
  ];

  var EQ_ENDINGS = [
    "  ⇒  👍👍",
    "  =  👍👍",
    "  ↦  👍👍",
    "  ►  Tr(|👍👍⟩⟨👍👍|) = 👍👍",
    "  ≡  |👍👍⟩  (estado físico normalizado)",
    "  ∴  ⟨Ω_👍| Ω_👍⟩ = 👍👍",
    "  ⟶  Res_{thumb} [ ℱ ] = 👍👍",
    "  ⇝  𝒮_matrix = 👍👍",
  ];

  var EQ_PREFIXES = [
    "𝒯_👍[g, A, Φ] := ",
    "ℒ_eff^{(👍)} = ",
    "Λ_👍^{nonpert} = ",
    "𝒵_partition = ",
    "𝒜_amplitude = ",
    "ℳ_on-shell = ",
  ];

  function generateThumbonicEquation() {
    var parts = [];
    var n = 4 + Math.floor(Math.random() * 4);
    for (var i = 0; i < n; i++) {
      parts.push(pick(EQ_FRAGMENTS));
    }
    var body = parts.join(pick(EQ_MIDDLES));
    return pick(EQ_PREFIXES) + body + pick(EQ_ENDINGS);
  }

  var lastGeneratedText = "";

  function initEquationGenerator() {
    var btn = $("generator-btn");
    var copyBtn = $("generator-copy-btn");
    var pre = $("generator-pre");
    var out = $("generator-output");
    var status = $("generator-status");
    if (!btn || !pre || !out) return;

    btn.addEventListener("click", function () {
      lastGeneratedText = generateThumbonicEquation();
      pre.textContent = lastGeneratedText;
      if (status) {
        status.textContent = "Nueva formulación no perturbativa generada";
        window.setTimeout(function () {
          if (status.textContent.indexOf("Nueva formulación") === 0) {
            status.textContent = "";
          }
        }, 4200);
      }
      out.classList.remove("generator-output--pulse");
      void out.offsetWidth;
      out.classList.add("generator-output--pulse");
    });

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var t = pre.textContent.trim();
        if (!t || t.indexOf("Pulsa") === 0) {
          showToast("Genera una ecuación primero.", 2200);
          return;
        }
        copyToClipboard(t, "Ecuación copiada al portapapeles.", "No se pudo copiar.");
      });
    }
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
    var fx = $("collapse-fx");
    var rad = $("collapse-radial");
    var shell = document.querySelector(".shell");

    if (eq) {
      eq.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
      });
    }

    playCollapseChime();

    if (!prefersReducedMotion) {
      if (fx) {
        fx.classList.remove("collapse-fx--on");
        void fx.offsetWidth;
        fx.classList.add("collapse-fx--on");
        window.setTimeout(function () {
          fx.classList.remove("collapse-fx--on");
        }, 520);
      }
      if (rad) {
        rad.classList.remove("collapse-radial--on");
        void rad.offsetWidth;
        rad.classList.add("collapse-radial--on");
        window.setTimeout(function () {
          rad.classList.remove("collapse-radial--on");
        }, 1150);
      }
      document.body.classList.remove("body--mega-quake");
      void document.body.offsetWidth;
      document.body.classList.add("body--mega-quake");
      window.setTimeout(function () {
        document.body.classList.remove("body--mega-quake");
      }, 620);
      if (shell) {
        shell.classList.remove("shell--mega-dim");
        void shell.offsetWidth;
        shell.classList.add("shell--mega-dim");
        window.setTimeout(function () {
          shell.classList.remove("shell--mega-dim");
        }, 1150);
      }
      window.setTimeout(function () {
        spawnCollapseParticles();
      }, 80);
    } else {
      if (fx) {
        fx.style.opacity = "0.14";
        fx.style.transition = "opacity 0.2s ease";
        window.setTimeout(function () {
          fx.style.opacity = "0";
          window.setTimeout(function () {
            fx.style.transition = "";
            fx.style.opacity = "";
          }, 220);
        }, 180);
      }
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
      }, 1100);
      if (!prefersReducedMotion) {
        res.classList.add("quantum-pulse-strong");
        window.setTimeout(function () {
          res.classList.remove("quantum-pulse-strong");
        }, 1450);
      }
    }

    if (!prefersReducedMotion) {
      appendRainBurst(22, 3400);
    }

    var msg =
      Math.random() < 0.5
        ? "Colapso thumbónico confirmado."
        : "El universo ha convergido en 👍👍";
    window.setTimeout(function () {
      showToast(msg, 3600);
    }, prefersReducedMotion ? 120 : 1050);
  }

  function initForceCollapse() {
    document.querySelectorAll(".js-force-collapse").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        runForceCollapse();
      });
    });
  }

  function initTitleThumbsEaster() {
    var thumbs = $("hero-title-thumbs");
    var title = $("hero-title");
    if (!thumbs || !title) return;
    var taps = 0;
    var tapTimer;
    thumbs.addEventListener("click", function (e) {
      e.stopPropagation();
      taps += 1;
      clearTimeout(tapTimer);
      tapTimer = window.setTimeout(function () {
        taps = 0;
      }, 2200);
      if (taps < 5) return;
      taps = 0;
      clearTimeout(tapTimer);
      var now = Date.now();
      if (now - lastTitleEggMs < 9000) return;
      lastTitleEggMs = now;
      var msg =
        Math.random() < 0.5
          ? "Nivel máximo de aprobación alcanzado"
          : "Estado thumbónico trascendente desbloqueado";
      showToast(msg, 3400);
      title.classList.add("hero-title--egg-halo");
      thumbs.classList.add("hero-title-thumbs--egg-glow");
      window.setTimeout(function () {
        title.classList.remove("hero-title--egg-halo");
        thumbs.classList.remove("hero-title-thumbs--egg-glow");
      }, 2600);
      if (!prefersReducedMotion) {
        appendRainBurst(26, 3600);
      }
    });
    thumbs.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        thumbs.click();
      }
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
      if (now - lastResultEasterMs < 9000) return;
      lastResultEasterMs = now;
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
    setSoundUI();

    var soundBtn = $("toggle-sound-btn");
    if (soundBtn && !prefersReducedMotion) {
      soundBtn.addEventListener("click", function () {
        var on = !loadSoundPreference();
        saveSoundPreference(on);
        setSoundUI();
        if (on) {
          entryChimePlayed = false;
          ensureEntryChime();
        }
      });
    }

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
    initTitleThumbsEaster();
    initEquationGenerator();
    bindDeferredEntryChime();
    window.setTimeout(function () {
      ensureEntryChime();
    }, 1680);
  });
})();
