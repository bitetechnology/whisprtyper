/* WhisprTyper site — progressive enhancement only.
   The page remains usable and readable without JavaScript. */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Decorative scroll reveal ---------- */
  var revealElements = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (revealElements.length && "IntersectionObserver" in window && !reducedMotion.matches) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );
    revealElements.forEach(function (element) {
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach(function (element) {
      element.classList.add("is-visible");
    });
  }

  /* ---------- Interactive product demo ----------
     Mirrors the native flow: recording waveform -> finalizing spinner ->
     one completed transcript inserted into the original field. This preview
     never requests microphone access and does not claim to transcribe audio. */
  var demo = document.querySelector("#voice-demo");
  var pill = document.querySelector("#demo-pill");
  var input = document.querySelector("#demo-input");
  var status = document.querySelector("#demo-status");
  if (!demo || !pill || !input || !status) return;

  var transcript = input.value;
  var previousValue = input.value;
  var activeOwner = null;
  var activationTimer = null;
  var finalTimer = null;
  var demoInView = false;

  function clearTimers() {
    if (activationTimer) {
      window.clearTimeout(activationTimer);
      activationTimer = null;
    }
    if (finalTimer) {
      window.clearTimeout(finalTimer);
      finalTimer = null;
    }
  }

  function setState(state) {
    pill.setAttribute("data-state", state);
    pill.setAttribute("aria-busy", state === "finalizing" ? "true" : "false");
    if (state === "recording") {
      pill.setAttribute("aria-label", "Release to finish the dictation preview");
    } else if (state === "finalizing") {
      pill.setAttribute("aria-label", "Finalizing and inserting the preview transcript");
    } else {
      pill.setAttribute("aria-label", "Activate or press and hold to preview dictation");
    }
  }

  function startPreview(owner) {
    if (activeOwner) return false;
    clearTimers();
    activeOwner = owner;
    previousValue = input.value;
    input.value = "";
    setState("recording");
    status.textContent = "Listening… release to finish.";
    return true;
  }

  function completePreview() {
    input.value = transcript;
    setState("idle");
    status.textContent = "Inserted in the preview field. Hold or activate again to replay.";
    activeOwner = null;
    finalTimer = null;
  }

  function finishPreview(owner) {
    if (!activeOwner || (owner && owner !== activeOwner)) return;
    if (pill.getAttribute("data-state") === "finalizing") return;
    if (activationTimer) {
      window.clearTimeout(activationTimer);
      activationTimer = null;
    }
    setState("finalizing");
    status.textContent = "Finalizing and inserting…";
    finalTimer = window.setTimeout(completePreview, 800);
  }

  function cancelPreview(message) {
    if (!activeOwner) return;
    clearTimers();
    input.value = previousValue;
    setState("idle");
    status.textContent = message || "Preview cancelled. Nothing was inserted.";
    activeOwner = null;
  }

  pill.addEventListener("pointerdown", function (event) {
    if ((event.button !== undefined && event.button !== 0) || event.isPrimary === false) return;
    event.preventDefault();
    if (!startPreview("pointer")) return;
    if (pill.setPointerCapture) {
      try { pill.setPointerCapture(event.pointerId); } catch (_) { /* Capture is an enhancement. */ }
    }
  });

  pill.addEventListener("pointerup", function (event) {
    if (activeOwner !== "pointer") return;
    event.preventDefault();
    finishPreview("pointer");
  });

  pill.addEventListener("pointercancel", function () {
    if (activeOwner === "pointer") cancelPreview();
  });

  /* A synthesized click is how VoiceOver, Switch Control, and similar tools
     activate a semantic button. Pointer and physical-key paths already own the
     state when their generated click arrives, so only an idle click starts this
     short accessible preview cycle. */
  pill.addEventListener("click", function (event) {
    event.preventDefault();
    if (event.detail > 0 || activeOwner) return;
    if (startPreview("activation")) {
      activationTimer = window.setTimeout(function () {
        finishPreview("activation");
      }, 900);
    }
  });

  pill.addEventListener("keydown", function (event) {
    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
      event.preventDefault();
      startPreview("button-key");
    }
  });

  pill.addEventListener("blur", function () {
    if (activeOwner === "button-key" || activeOwner === "activation") cancelPreview();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && activeOwner) {
      event.preventDefault();
      cancelPreview();
      return;
    }
    if (activeOwner === "control" && event.key !== "Control") {
      cancelPreview("Preview cancelled because Control was used in a shortcut.");
      return;
    }
    if (activeOwner === "button-key" && event.key !== " " && event.key !== "Enter") {
      cancelPreview();
      return;
    }
    if (event.key !== "Control" || event.repeat || event.altKey || event.metaKey || event.shiftKey) return;
    if (!demoInView) return;
    startPreview("control");
  });

  document.addEventListener("keyup", function (event) {
    if (event.key === "Control") {
      finishPreview("control");
    } else if (event.key === " " || event.key === "Enter") {
      finishPreview("button-key");
    }
  });

  window.addEventListener("blur", function () {
    if (activeOwner) cancelPreview();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && activeOwner) cancelPreview();
  });

  window.addEventListener("pagehide", function () {
    if (activeOwner) cancelPreview();
  });

  if ("IntersectionObserver" in window) {
    var demoObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          demoInView = entry.isIntersecting && entry.intersectionRatio >= 0.45;
        });
      },
      { threshold: [0, 0.45] }
    );
    demoObserver.observe(demo);
  } else {
    demoInView = true;
  }
})();

/* ---------- Hero typewriter-wave scene ----------
   Decorative deterministic loop: an editorial sentence types out letter by
   letter along a 2D wave (it rises and falls a couple of times, then flattens)
   and the whole sentence lands in the dark-glass pill, which then finalizes and
   docks the finished sentence to the right. Purely visual — it never requests
   microphone access. The in-markup --x/--y letter positions are a complete
   static diagram (the full sentence along the wave), so this module only
   enhances; it runs requestAnimationFrame solely while the stage is on screen,
   the page is visible, and reduced motion is not requested. */
(function () {
  "use strict";

  var stage = document.getElementById("hero-stage");
  if (!stage) return;

  var pill = stage.querySelector(".hero-pill");
  var label = stage.querySelector(".hero-stage-label");
  var out = stage.querySelector(".hero-out");
  var pathIn = document.getElementById("hero-path");
  var letters = Array.prototype.slice.call(stage.querySelectorAll(".hero-letter"));
  if (!pill || !label || !out || !pathIn || !letters.length) return;
  if (typeof pathIn.getTotalLength !== "function") return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  var CYCLE_MS = 9000;
  /* Contiguous normalized phases; ranges mirror motion-spec.yaml. */
  var PHASES = [
    { until: 0.74, pill: "recording", text: "listening" },
    { until: 0.84, pill: "finalizing", text: "finalizing" },
    { until: 0.96, pill: "inserted", text: "inserted" },
    { until: 1.01, pill: "recording", text: "listening" }
  ];

  var TYPE_START = 0.04;   /* when the first letter appears */
  var TYPE_END = 0.62;     /* last letter typed by here */
  var OUT_START = 0.74;    /* finalized sentence docks out */
  var OUT_TRAVEL = 0.16;
  var OUT_FADE = 0.96;

  var lenIn = pathIn.getTotalLength();
  var N = letters.length;

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeInOut(v) { return v * v * (3 - 2 * v); }

  function placeLetter(letter, fraction, opacity) {
    var point = pathIn.getPointAtLength(lenIn * clamp01(fraction));
    letter.style.setProperty("--x", point.x.toFixed(2));
    letter.style.setProperty("--y", point.y.toFixed(2));
    letter.style.setProperty("--o", opacity.toFixed(3));
  }

  /* Per-letter static positions (from markup) so reduced-motion shows the
     full sentence along the wave. */
  var staticDefaults = letters.concat([out]).map(function (element) {
    return { element: element, css: element.getAttribute("style") || "" };
  });
  var staticLabel = label.textContent;

  var pillState = pill.getAttribute("data-state");
  function setPill(state) {
    if (state === pillState) return;
    pillState = state;
    pill.setAttribute("data-state", state);
  }

  var labelText = staticLabel;
  function setLabel(text) {
    if (text === labelText) return;
    labelText = text;
    label.textContent = text;
  }

  function render(t) {
    var phase = PHASES[PHASES.length - 1];
    for (var i = 0; i < PHASES.length; i++) {
      if (t < PHASES[i].until) { phase = PHASES[i]; break; }
    }
    setPill(phase.pill);
    setLabel(phase.text);

    /* Typewriter: each letter turns on at its slice of [TYPE_START, TYPE_END],
       rides the wave inward, and stays lit through finalizing/inserted. */
    var typeU = clamp01((t - TYPE_START) / (TYPE_END - TYPE_START));
    var typedCount = Math.floor(typeU * N + 1e-6);
    for (var k = 0; k < N; k++) {
      if (k < typedCount) {
        /* letter already typed: sit at its wave position (fraction = (k+0.5)/N) */
        var frac = (k + 0.5) / N;
        placeLetter(letters[k], frac, 1);
      } else {
        letters[k].style.setProperty("--o", "0");
      }
    }

    /* A blinking caret on the last lit letter while we are still typing. */
    var caretIndex = (t >= TYPE_START && t < TYPE_END && typedCount > 0 && typedCount < N) ? (typedCount - 1) : -1;
    for (var c = 0; c < N; c++) {
      if (c === caretIndex) letters[c].classList.add("is-caret");
      else letters[c].classList.remove("is-caret");
    }

    var e = clamp01((t - OUT_START) / OUT_TRAVEL);
    var opacity = t < OUT_START ? 0 : clamp01(e / 0.25);
    if (t >= OUT_FADE) opacity = clamp01((1 - t) / (1 - OUT_FADE));
    /* Finalized sentence docks to the right of the pill (static --x:82;--y:52). */
    out.style.setProperty("--o", opacity.toFixed(3));

    /* Once the sentence has typed, fade the in-wave letters out as the docked
       sentence takes over, so the wave clears before the next loop. */
    if (t >= TYPE_END) {
      var fade = clamp01((t - TYPE_END) / 0.12);
      for (var j = 0; j < N; j++) {
        letters[j].style.setProperty("--o", (1 - fade).toFixed(3));
      }
    }
  }

  var rafId = null;
  var elapsed = 0;
  var lastTs = null;

  function frame(ts) {
    if (lastTs !== null) elapsed += Math.min(ts - lastTs, 250);
    lastTs = ts;
    render((elapsed % CYCLE_MS) / CYCLE_MS);
    rafId = window.requestAnimationFrame(frame);
  }

  function start() {
    if (rafId !== null) return;
    stage.classList.add("is-animated");
    lastTs = null;
    rafId = window.requestAnimationFrame(frame);
  }

  function stop() {
    if (rafId !== null) window.cancelAnimationFrame(rafId);
    rafId = null;
    lastTs = null;
    stage.classList.remove("is-animated");
  }

  /* Reduced motion: back to the complete static diagram, no loop at all. */
  function restoreStatic() {
    stop();
    elapsed = 0;
    stage.classList.remove("is-animated");
    staticDefaults.forEach(function (item) {
      if (item.css) item.element.setAttribute("style", item.css);
      else item.element.removeAttribute("style");
    });
    setPill("recording");
    setLabel(staticLabel);
  }

  var stageInView = false;
  function sync() {
    if (reducedMotion.matches) {
      restoreStatic();
      return;
    }
    if (stageInView && !document.hidden) start();
    else stop();
  }

  if ("IntersectionObserver" in window) {
    var stageObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          stageInView = entry.isIntersecting;
        });
        sync();
      },
      { threshold: 0.1 }
    );
    stageObserver.observe(stage);
  } else {
    stageInView = true;
    sync();
  }

  document.addEventListener("visibilitychange", sync);
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", sync);
  } else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(sync);
  }
})();
