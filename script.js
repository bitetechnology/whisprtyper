/* WhisprTyper site — progressive enhancement only.
   The page remains usable and readable without JavaScript. */
(function () {
  "use strict";

  /* ---------- Privacy-safe CTA analytics ---------- */
  var CTA_TIMEOUT_MS = 5000;
  var OUTCOMES = {
    cta_success: true,
    cta_timeout: true,
    cta_error: true
  };

  function trackEvent(eventName, cta) {
    if (!window.umami || typeof window.umami.track !== "function") return;
    try {
      var result = window.umami.track(eventName, { cta: cta });
      if (result && typeof result.catch === "function") result.catch(function () {});
    } catch (_) {
      /* Analytics must never interrupt the user's action. */
    }
  }

  function beginCta(cta, timeoutMs) {
    var settled = false;
    var timeout = Math.max(1000, timeoutMs || CTA_TIMEOUT_MS);
    var timer = null;

    function waitForResult() {
      if (settled || timer !== null) return;
      timer = window.setTimeout(function () {
        settle("cta_timeout");
      }, timeout);
    }

    function settle(eventName) {
      if (settled || !OUTCOMES[eventName]) return;
      settled = true;
      if (timer !== null) window.clearTimeout(timer);
      trackEvent(eventName, cta);
    }

    trackEvent("cta_click", cta);

    return {
      waitForResult: waitForResult,
      success: function () { settle("cta_success"); },
      error: function () { settle("cta_error"); },
      cancel: function () {
        if (settled) return;
        settled = true;
        if (timer !== null) window.clearTimeout(timer);
      }
    };
  }

  window.whisprAnalytics = { beginCta: beginCta };

  function ctaName(link) {
    var href = link.getAttribute("href") || "";
    if (href.indexOf("/releases/download/") !== -1) return "download_mac";
    if (href === "demo.html" || href.slice(-10) === "/demo.html") return "try_demo";
    return null;
  }

  Array.prototype.forEach.call(document.querySelectorAll("a.button[href]"), function (link) {
    var cta = ctaName(link);
    if (!cta) return;
    link.addEventListener("click", function (event) {
      if ((event.button !== undefined && event.button !== 0) || event.defaultPrevented) return;
      var outcome = beginCta(cta, CTA_TIMEOUT_MS);
      outcome.waitForResult();
      window.setTimeout(function () {
        try {
          /* A link succeeds when its valid browser navigation/download handoff
             remains enabled. This does not claim that a download completed. */
          if (!event.defaultPrevented && link.getAttribute("href")) outcome.success();
        } catch (_) {
          outcome.error();
        }
      }, 0);
    });
  });
  /* ---------- End privacy-safe CTA analytics ---------- */
})();

(function () {
  "use strict";

  var motionToggle = document.getElementById("motion-toggle");
  if (motionToggle) {
    motionToggle.addEventListener("click", function () {
      var paused = document.body.classList.toggle("motion-paused");
      motionToggle.setAttribute("aria-pressed", paused ? "true" : "false");
      motionToggle.setAttribute("title", paused ? "Resume animations" : "Pause animations");
      var glyph = motionToggle.querySelector(".motion-toggle-glyph");
      if (glyph) glyph.textContent = paused ? "▶" : "❚❚";
      window.dispatchEvent(new Event("whisprmotionchange"));
    });
  }

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

  var transcript = input.getAttribute("data-transcript") || input.value;
  var previousValue = input.value;
  var activeOwner = null;
  var activationTimer = null;
  var finalTimer = null;
  var demoInView = false;
  var demoCtaOutcome = null;

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
    demoCtaOutcome = window.whisprAnalytics
      ? window.whisprAnalytics.beginCta("demo_preview", 3000)
      : null;
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
    if (demoCtaOutcome) demoCtaOutcome.success();
    demoCtaOutcome = null;
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
    if (demoCtaOutcome) demoCtaOutcome.waitForResult();
    finalTimer = window.setTimeout(completePreview, 800);
  }

  function cancelPreview(message) {
    if (!activeOwner) return;
    clearTimers();
    input.value = previousValue;
    setState("idle");
    status.textContent = message || "Preview cancelled. Nothing was inserted.";
    if (demoCtaOutcome) demoCtaOutcome.cancel();
    demoCtaOutcome = null;
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

/* ---------- Hero continuous through-pill sentence ribbon ----------
   One shared responsive SVG path runs from off-left, through the pill center,
   to off-right. Two identical full-sentence copies form a seamless conveyor.
   Each copy is rendered twice with the exact same startOffset: muted ink in
   the input clip and ivory in the output clip above a black ribbon. The pill
   covers the split, so the same glyphs visibly enter, pass through, and leave
   on the other side. The hero bars are driven from the same transport clock;
   there are no random word reveals, independent opacity changes, finalizing
   state, static output card, microphone request, or audio API. */
(function () {
  "use strict";

  var stage = document.getElementById("hero-stage");
  if (!stage) return;

  var svg = stage.querySelector("svg.stage-curves");
  var pill = stage.querySelector(".hero-pill");
  var path = document.getElementById("hero-path");
  var ribbon = stage.querySelector(".hero-ribbon");
  var clipInRect = document.getElementById("hero-clip-in-rect");
  var clipOutRect = document.getElementById("hero-clip-out-rect");
  var inputCopies = Array.prototype.slice.call(stage.querySelectorAll(".hero-sentence-in"));
  var outputCopies = Array.prototype.slice.call(stage.querySelectorAll(".hero-sentence-out"));
  var inputPaths = inputCopies.map(function (copy) { return copy.querySelector("textPath"); });
  var outputPaths = outputCopies.map(function (copy) { return copy.querySelector("textPath"); });
  var bars = Array.prototype.slice.call(pill ? pill.querySelectorAll(".pill-wave i") : []);
  var measureProbe = null;

  if (!svg || !pill || !path || !ribbon || !clipInRect || !clipOutRect) return;
  if (inputCopies.length !== 2 || outputCopies.length !== 2 || bars.length === 0) return;
  if (inputPaths.concat(outputPaths).some(function (node) { return !node; })) return;
  if (typeof path.getTotalLength !== "function") return;

  measureProbe = document.createElementNS("http://www.w3.org/2000/svg", "text");
  measureProbe.setAttribute("class", "hero-sentence-copy hero-measure-probe");
  measureProbe.setAttribute("x", "-10000");
  measureProbe.setAttribute("y", "0");
  measureProbe.setAttribute("aria-hidden", "true");
  measureProbe.textContent = inputCopies[0].textContent;
  svg.appendChild(measureProbe);

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var TRANSPORT_SPEED = 78; /* CSS px (SVG user units) per second */
  var GAP_EM = 2.4;
  var staticOffsets = inputPaths.map(function (node) {
    return node.getAttribute("startOffset") || "0";
  });
  var rafId = null;
  var elapsed = 0;
  var lastTs = null;
  var stageInView = false;
  var resizeRaf = null;
  var sentenceAdvance = 1;
  var pitch = 1;

  function copyFontSize() {
    var size = parseFloat(window.getComputedStyle(inputCopies[0]).fontSize);
    return size > 0 ? size : 16;
  }

  function measureConveyor() {
    /* WebKit reports only the currently visible portion for text attached to a
       path, which makes the repeated-copy pitch too short and causes overlap.
       Measure the same styled sentence off-path so every browser returns its
       full intrinsic advance. */
    var advance = 0;
    if (typeof measureProbe.getComputedTextLength === "function") {
      advance = measureProbe.getComputedTextLength();
    }
    if (!(advance > 0)) advance = measureProbe.textContent.length * copyFontSize() * 0.5;
    sentenceAdvance = advance;
    pitch = sentenceAdvance + copyFontSize() * GAP_EM;
  }

  /* One restrained, shallow, non-self-intersecting S. It enters off-left just
     below the pill center, crosses the measured center with a single smooth
     inflection, and exits off-right just above it — no entry hook, abrupt
     crest, or opposing steep arcs, so the moving text stays easy to scan. */
  function buildFlowPath(width, height, centerX, centerY) {
    var compact = width < 560;
    var overshoot = Math.max(compact ? 26 : 64, width * 0.075);
    var sway = Math.min(height * (compact ? 0.11 : 0.15), compact ? 26 : 52);
    var startX = -overshoot;
    var endX = width + overshoot;
    var startY = centerY + sway;
    var endY = centerY - sway;
    var leftSpan = centerX - startX;
    var rightSpan = endX - centerX;

    return "M " + startX.toFixed(2) + " " + startY.toFixed(2)
      + " C " + (startX + leftSpan * 0.45).toFixed(2) + " " + startY.toFixed(2)
      + " " + (centerX - leftSpan * 0.3).toFixed(2) + " " + (centerY + sway * 0.25).toFixed(2)
      + " " + centerX.toFixed(2) + " " + centerY.toFixed(2)
      + " C " + (centerX + rightSpan * 0.3).toFixed(2) + " " + (centerY - sway * 0.25).toFixed(2)
      + " " + (endX - rightSpan * 0.45).toFixed(2) + " " + endY.toFixed(2)
      + " " + endX.toFixed(2) + " " + endY.toFixed(2);
  }

  /* Match the SVG coordinate space to rendered CSS pixels, split both color
     layers at the measured pill center, and keep the black ribbon on the exact
     output half of the shared path. */
  function rebuildGeometry() {
    var stageRect = stage.getBoundingClientRect();
    var pillRect = pill.getBoundingClientRect();
    if (!stageRect.width || !stageRect.height || !pillRect.width) return;

    var centerX = pillRect.left - stageRect.left + pillRect.width / 2;
    var centerY = pillRect.top - stageRect.top + pillRect.height / 2;
    var compact = stageRect.width < 560;
    var overshoot = Math.max(compact ? 26 : 64, stageRect.width * 0.075);
    var clipPad = overshoot * 3;

    svg.setAttribute("viewBox", "0 0 " + stageRect.width.toFixed(2) + " " + stageRect.height.toFixed(2));
    path.setAttribute("d", buildFlowPath(stageRect.width, stageRect.height, centerX, centerY));
    ribbon.setAttribute("stroke-width", compact ? "28" : "34");
    ribbon.setAttribute("transform", compact ? "translate(0 -4)" : "translate(0 -5)");

    clipInRect.setAttribute("x", (-clipPad).toFixed(2));
    clipInRect.setAttribute("y", (-stageRect.height).toFixed(2));
    clipInRect.setAttribute("width", (centerX + clipPad).toFixed(2));
    clipInRect.setAttribute("height", (stageRect.height * 3).toFixed(2));
    clipOutRect.setAttribute("x", centerX.toFixed(2));
    clipOutRect.setAttribute("y", (-stageRect.height).toFixed(2));
    clipOutRect.setAttribute("width", (stageRect.width - centerX + clipPad).toFixed(2));
    clipOutRect.setAttribute("height", (stageRect.height * 3).toFixed(2));

    measureConveyor();
  }

  function setPairOffset(index, value) {
    var offset = value.toFixed(2);
    inputPaths[index].setAttribute("startOffset", offset);
    outputPaths[index].setAttribute("startOffset", offset);
  }

  /* The waveform is not a separate decorative loop: every bar and the subtle
     pill pulse are deterministic functions of the same transport position as
     the sentence copies. */
  function renderWave(transportPx) {
    var phase = transportPx * 0.055;
    for (var i = 0; i < bars.length; i++) {
      var carrier = Math.sin(phase + i * 0.73);
      var overtone = Math.sin(phase * 0.57 - i * 1.09);
      var energy = Math.abs(carrier * 0.72 + overtone * 0.28);
      bars[i].style.transform = "scaleY(" + (0.5 + energy * 0.62).toFixed(3) + ")";
    }
    var pulse = 1 + (0.5 + 0.5 * Math.sin(phase * 0.82)) * 0.012;
    pill.style.setProperty("--hero-pulse", pulse.toFixed(4));
  }

  function render(transportPx) {
    var cycle = pitch * 2;
    var base = ((transportPx % cycle) + cycle) % cycle;
    for (var i = 0; i < 2; i++) {
      var pos = (base + i * pitch) % cycle;
      if (pos >= pitch) pos -= cycle;
      setPairOffset(i, pos);
    }
    renderWave(transportPx);
  }

  function renderNow() {
    render((elapsed / 1000) * TRANSPORT_SPEED);
  }

  function frame(timestamp) {
    if (lastTs !== null) elapsed += Math.min(timestamp - lastTs, 250);
    lastTs = timestamp;
    renderNow();
    rafId = window.requestAnimationFrame(frame);
  }

  function start() {
    if (rafId !== null) return;
    stage.classList.add("is-animated");
    rebuildGeometry();
    renderNow();
    lastTs = null;
    rafId = window.requestAnimationFrame(frame);
  }

  function stop() {
    if (rafId !== null) window.cancelAnimationFrame(rafId);
    rafId = null;
    lastTs = null;
    stage.classList.remove("is-animated");
  }

  function restoreStatic() {
    stop();
    elapsed = 0;
    rebuildGeometry();
    staticOffsets.forEach(function (offset, index) {
      inputPaths[index].setAttribute("startOffset", offset);
      outputPaths[index].setAttribute("startOffset", offset);
    });
    bars.forEach(function (bar) { bar.style.transform = ""; });
    pill.style.setProperty("--hero-pulse", "1");
    pill.setAttribute("data-state", "recording");
  }

  function sync() {
    if (reducedMotion.matches) {
      restoreStatic();
      return;
    }
    if (document.body.classList.contains("motion-paused")) {
      stop();
      return;
    }
    if (stageInView && !document.hidden) start();
    else stop();
  }

  function queueGeometryRefresh() {
    if (resizeRaf !== null) window.cancelAnimationFrame(resizeRaf);
    resizeRaf = window.requestAnimationFrame(function () {
      resizeRaf = null;
      rebuildGeometry();
    });
  }

  if ("ResizeObserver" in window) {
    new ResizeObserver(queueGeometryRefresh).observe(stage);
  } else {
    window.addEventListener("resize", queueGeometryRefresh, { passive: true });
  }

  if ("IntersectionObserver" in window) {
    var stageObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { stageInView = entry.isIntersecting; });
      sync();
    }, { threshold: 0.1 });
    stageObserver.observe(stage);
  } else {
    stageInView = true;
    sync();
  }

  document.addEventListener("visibilitychange", sync);
  window.addEventListener("whisprmotionchange", sync);
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", sync);
  } else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(sync);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(queueGeometryRefresh);
  }
})();

/* ---------- App compatibility train ----------
   The 24 brand tiles ride one deterministic conveyor: each tile's position
   is a pure function of elapsed transport time, its index, and the measured
   stage size (x advances left-to-right, y follows a broad fixed sine curve).
   The loop runs only while the stage is on screen, the tab is visible, and
   reduced motion is not requested; otherwise the authored static flex
   arrangement from the stylesheet remains, which is also the no-JS state. */
(function () {
  "use strict";

  var stage = document.getElementById("apps-stage");
  var train = document.getElementById("app-train");
  if (!stage || !train) return;
  var tiles = Array.prototype.slice.call(train.querySelectorAll(".app-tile"));
  if (!tiles.length) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var SPEED = 44;         /* CSS px per second, moving left-to-right */
  var WAVE_CYCLES = 1.25; /* broad rise and fall across the stage width */
  var rafId = null;
  var lastTs = null;
  var elapsed = 0;
  var inView = false;
  var resizeRaf = null;
  var geom = null;

  function measure() {
    if (!stage.classList.contains("is-animated")) { geom = null; return; }
    var rect = stage.getBoundingClientRect();
    var tileSize = tiles[0].offsetWidth || 64;
    if (!rect.width || !rect.height) { geom = null; return; }
    var spacing = Math.max(tileSize * 1.55, (rect.width + tileSize * 4) / tiles.length);
    geom = {
      tile: tileSize,
      spacing: spacing,
      span: spacing * tiles.length,
      midY: rect.height / 2,
      amp: Math.max(10, (rect.height - tileSize) / 2 - 12),
      k: (Math.PI * 2 * WAVE_CYCLES) / rect.width
    };
  }

  function render() {
    if (!geom) return;
    var shift = (elapsed / 1000) * SPEED;
    for (var i = 0; i < tiles.length; i++) {
      var pos = (i * geom.spacing + shift) % geom.span;
      if (pos < 0) pos += geom.span;
      var x = pos - geom.spacing;
      var y = geom.midY - geom.tile / 2 + geom.amp * Math.sin(x * geom.k + 0.6);
      tiles[i].style.transform = "translate3d(" + x.toFixed(2) + "px, " + y.toFixed(2) + "px, 0)";
    }
  }

  function frame(timestamp) {
    if (lastTs !== null) elapsed += Math.min(timestamp - lastTs, 250);
    lastTs = timestamp;
    render();
    rafId = window.requestAnimationFrame(frame);
  }

  function start() {
    if (rafId !== null) return;
    stage.classList.add("is-animated");
    measure();
    render();
    lastTs = null;
    rafId = window.requestAnimationFrame(frame);
  }

  function stop() {
    if (rafId !== null) window.cancelAnimationFrame(rafId);
    rafId = null;
    lastTs = null;
  }

  function restoreStatic() {
    stop();
    elapsed = 0;
    geom = null;
    stage.classList.remove("is-animated");
    tiles.forEach(function (tile) { tile.style.transform = ""; });
  }

  function sync() {
    if (reducedMotion.matches) {
      restoreStatic();
      return;
    }
    if (document.body.classList.contains("motion-paused")) {
      stop();
      return;
    }
    if (inView && !document.hidden) start();
    else stop();
  }

  function queueMeasure() {
    if (resizeRaf !== null) window.cancelAnimationFrame(resizeRaf);
    resizeRaf = window.requestAnimationFrame(function () {
      resizeRaf = null;
      measure();
      render();
    });
  }

  if ("ResizeObserver" in window) {
    new ResizeObserver(queueMeasure).observe(stage);
  } else {
    window.addEventListener("resize", queueMeasure, { passive: true });
  }

  if ("IntersectionObserver" in window) {
    var stageObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { inView = entry.isIntersecting; });
      sync();
    }, { threshold: 0.1 });
    stageObserver.observe(stage);
  } else {
    inView = true;
    sync();
  }

  document.addEventListener("visibilitychange", sync);
  window.addEventListener("whisprmotionchange", sync);
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", sync);
  } else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(sync);
  }
})();

/* ---------- 45 → 220 WPM shared-path conveyor ---------- */
(function () {
  "use strict";

  var grid = document.getElementById("speed-flow");
  if (!grid) return;

  var stage = grid.querySelector(".speed-flow-stage");
  var svg = grid.querySelector(".speed-flow-svg");
  var path = document.getElementById("speed-flow-path");
  var voiceClip = document.getElementById("speed-flow-voice-clip-rect");
  var keyboardCard = grid.querySelector(".speed-card-keys");
  var voiceCard = grid.querySelector(".speed-card-voice");
  var words = Array.prototype.slice.call(grid.querySelectorAll("[data-flow-word]"));
  if (!stage || !svg || !path || !voiceClip || !keyboardCard || !voiceCard || words.length === 0) return;
  if (typeof path.getTotalLength !== "function") return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var KEYBOARD_SPEED = 28;
  var VOICE_SPEED = 108;
  var ENDPOINT_FADE_PX = 72;
  var stackedLayout = false;
  var rafId = null;
  var lastTs = null;
  var cycleTime = 0;
  var inView = false;
  var resizeRaf = null;
  var pathLength = 1;
  var totalTravelTime = 1;
  var distanceTable = [];
  var timeTable = [];
  var voiceBounds = { x: 0, y: 0, width: 0, height: 0 };
  var speedRampStart = 0.3;
  var speedRampEnd = 0.42;

  function smoothstep(edge0, edge1, value) {
    var x = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
    return x * x * (3 - 2 * x);
  }

  function velocityAtProgress(progress) {
    return KEYBOARD_SPEED + (VOICE_SPEED - KEYBOARD_SPEED) * smoothstep(speedRampStart, speedRampEnd, progress);
  }

  function updateSpeedRamp() {
    var samples = 360;
    var voiceEntry = null;
    for (var i = 0; i <= samples; i++) {
      var progress = i / samples;
      if (isInVoice(path.getPointAtLength(pathLength * progress))) {
        voiceEntry = progress;
        break;
      }
    }
    speedRampStart = voiceEntry === null ? 0.3 : Math.min(0.98, voiceEntry);
    speedRampEnd = Math.min(1, speedRampStart + 0.12);
  }

  function buildSpeedPath(width, height, compact, keyBounds, voice) {
    if (compact) {
      /* Stacked cards get a broad soft S derived from the measured card
         geometry: a low Keyboard leg runs left to right beneath that card's
         copy, a contained right-hand bend sweeps down into the Voice card, a
         wide middle return travels back toward the left inside its reserved
         bottom band, and a low Voice leg exits right. Every interior control
         point stays inside or just beside the stage. */
      var keyLegY = Math.max(56, keyBounds.y + keyBounds.height - 46);
      var exitLegY = voice.y + voice.height - 40;
      /* Keep the middle return and lower exit legs clearly separated
         (~118px centerlines) so the thick lavender stroke reads as a soft S
         instead of merging into a U outline; the Voice card reserves a
         matching bottom band below its copy. */
      var returnLegY = Math.max(voice.y + 56, exitLegY - 118);
      var rightBendX = width - 26;
      var leftBendX = 30;
      var drop = returnLegY - keyLegY;
      var dropMidY = (keyLegY + returnLegY) / 2;
      var settleMidY = (returnLegY + exitLegY) / 2;
      return "M -30 " + keyLegY.toFixed(2)
        + " C " + (width * 0.3).toFixed(2) + " " + keyLegY.toFixed(2)
        + " " + (width * 0.52).toFixed(2) + " " + keyLegY.toFixed(2)
        + " " + (width * 0.7).toFixed(2) + " " + (keyLegY + 3).toFixed(2)
        + " C " + (width * 0.9).toFixed(2) + " " + (keyLegY + 8).toFixed(2)
        + " " + rightBendX.toFixed(2) + " " + (keyLegY + drop * 0.3).toFixed(2)
        + " " + rightBendX.toFixed(2) + " " + dropMidY.toFixed(2)
        + " C " + rightBendX.toFixed(2) + " " + (keyLegY + drop * 0.76).toFixed(2)
        + " " + (width * 0.88).toFixed(2) + " " + returnLegY.toFixed(2)
        + " " + (width * 0.68).toFixed(2) + " " + returnLegY.toFixed(2)
        + " C " + (width * 0.48).toFixed(2) + " " + returnLegY.toFixed(2)
        + " " + (width * 0.3).toFixed(2) + " " + returnLegY.toFixed(2)
        + " " + (width * 0.2).toFixed(2) + " " + (returnLegY + 4).toFixed(2)
        + " C " + (width * 0.09).toFixed(2) + " " + (returnLegY + 9).toFixed(2)
        + " " + leftBendX.toFixed(2) + " " + (returnLegY + 18).toFixed(2)
        + " " + leftBendX.toFixed(2) + " " + settleMidY.toFixed(2)
        + " C " + leftBendX.toFixed(2) + " " + (exitLegY - 16).toFixed(2)
        + " " + (width * 0.12).toFixed(2) + " " + exitLegY.toFixed(2)
        + " " + (width * 0.32).toFixed(2) + " " + exitLegY.toFixed(2)
        + " C " + (width * 0.56).toFixed(2) + " " + exitLegY.toFixed(2)
        + " " + (width * 0.8).toFixed(2) + " " + exitLegY.toFixed(2)
        + " " + (width + 30).toFixed(2) + " " + exitLegY.toFixed(2);
    }

    var baseY = Math.max(80, height - Math.min(66, height * 0.17));
    var seamX = voice.x;
    return "M -40 " + baseY.toFixed(2)
      + " C " + (seamX * 0.34).toFixed(2) + " " + baseY.toFixed(2)
      + " " + (seamX * 0.72).toFixed(2) + " " + (baseY - 10).toFixed(2)
      + " " + (seamX + 8).toFixed(2) + " " + (baseY - 6).toFixed(2)
      + " C " + (seamX + (width - seamX) * 0.28).toFixed(2) + " " + (baseY + 10).toFixed(2)
      + " " + (width * 0.78).toFixed(2) + " " + (baseY - 30).toFixed(2)
      + " " + (width + 40).toFixed(2) + " " + (baseY - 24).toFixed(2);
  }

  function rebuildTimingTable() {
    pathLength = Math.max(1, path.getTotalLength());
    updateSpeedRamp();
    distanceTable = [0];
    timeTable = [0];
    var samples = 360;
    var elapsed = 0;
    for (var i = 1; i <= samples; i++) {
      var distance = pathLength * i / samples;
      var previous = pathLength * (i - 1) / samples;
      var midpoint = (distance + previous) * 0.5 / pathLength;
      elapsed += (distance - previous) / velocityAtProgress(midpoint);
      distanceTable.push(distance);
      timeTable.push(elapsed);
    }
    totalTravelTime = Math.max(0.001, elapsed);
    cycleTime %= totalTravelTime;
  }

  function distanceAtTime(time) {
    var target = ((time % totalTravelTime) + totalTravelTime) % totalTravelTime;
    var low = 0;
    var high = timeTable.length - 1;
    while (low + 1 < high) {
      var mid = (low + high) >> 1;
      if (timeTable[mid] <= target) low = mid;
      else high = mid;
    }
    var span = timeTable[high] - timeTable[low] || 1;
    var ratio = (target - timeTable[low]) / span;
    return distanceTable[low] + (distanceTable[high] - distanceTable[low]) * ratio;
  }

  function isInVoice(point) {
    return point.x >= voiceBounds.x && point.x <= voiceBounds.x + voiceBounds.width
      && point.y >= voiceBounds.y && point.y <= voiceBounds.y + voiceBounds.height;
  }

  function render() {
    if (distanceTable.length < 2 || timeTable.length < 2) return;
    words.forEach(function (word) {
      var phase = parseFloat(word.getAttribute("data-phase")) || 0;
      var distance = distanceAtTime(cycleTime + phase * totalTravelTime);
      var point = path.getPointAtLength(distance);
      /* The local tangent is always computed. Side-by-side layouts tilt each
         word along it; stacked layouts keep every label at rotate(0) and use
         it only to fade labels nearly out on the steep vertical connectors
         between legs, so no word ever renders rotated or chopped mid-bend. */
      var tangentStart = point;
      var tangentEnd = path.getPointAtLength(Math.min(pathLength, distance + 1.5));
      if (distance >= pathLength - 1.5) {
        tangentStart = path.getPointAtLength(Math.max(0, distance - 1.5));
        tangentEnd = point;
      }
      var angle = Math.atan2(tangentEnd.y - tangentStart.y, tangentEnd.x - tangentStart.x) * 180 / Math.PI;
      if (angle > 90) angle -= 180;
      if (angle < -90) angle += 180;
      var rotation = stackedLayout ? 0 : angle;
      var slopeFade = stackedLayout ? 1 - 0.92 * smoothstep(38, 72, Math.abs(angle)) : 1;
      var edgeDistance = Math.min(distance, pathLength - distance);
      var fade = Math.max(0, Math.min(1, edgeDistance / ENDPOINT_FADE_PX)) * slopeFade;
      word.setAttribute("opacity", fade.toFixed(3));
      word.setAttribute("transform", "translate(" + point.x.toFixed(2) + " " + point.y.toFixed(2) + ") rotate(" + rotation.toFixed(2) + ")");
      word.classList.toggle("speed-flow-word-voice", isInVoice(point));
    });
  }

  function rebuildGeometry() {
    var stageRect = stage.getBoundingClientRect();
    var keyRect = keyboardCard.getBoundingClientRect();
    var voiceRect = voiceCard.getBoundingClientRect();
    if (!stageRect.width || !stageRect.height) return;

    var keyBounds = {
      x: keyRect.left - stageRect.left,
      y: keyRect.top - stageRect.top,
      width: keyRect.width,
      height: keyRect.height
    };
    voiceBounds = {
      x: voiceRect.left - stageRect.left,
      y: voiceRect.top - stageRect.top,
      width: voiceRect.width,
      height: voiceRect.height
    };
    var compact = voiceBounds.y >= keyBounds.y + keyBounds.height - 1;
    stackedLayout = compact;
    svg.setAttribute("viewBox", "0 0 " + stageRect.width.toFixed(2) + " " + stageRect.height.toFixed(2));
    path.setAttribute("d", buildSpeedPath(stageRect.width, stageRect.height, compact, keyBounds, voiceBounds));
    voiceClip.setAttribute("x", voiceBounds.x.toFixed(2));
    voiceClip.setAttribute("y", voiceBounds.y.toFixed(2));
    voiceClip.setAttribute("width", voiceBounds.width.toFixed(2));
    voiceClip.setAttribute("height", voiceBounds.height.toFixed(2));
    rebuildTimingTable();
    render();
  }

  function stop() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    lastTs = null;
  }

  function frame(timestamp) {
    if (lastTs === null) lastTs = timestamp;
    var delta = Math.min(250, Math.max(0, timestamp - lastTs));
    lastTs = timestamp;
    cycleTime = (cycleTime + delta / 1000) % totalTravelTime;
    render();
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (rafId !== null) return;
    lastTs = null;
    rafId = requestAnimationFrame(frame);
  }

  function restoreStatic() {
    stop();
    cycleTime = 0;
    rebuildGeometry();
  }

  function sync() {
    if (reducedMotion.matches) {
      restoreStatic();
      return;
    }
    if (document.body.classList.contains("motion-paused")) {
      stop();
      return;
    }
    if (inView && !document.hidden) start();
    else stop();
  }

  function queueRebuild() {
    if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(function () {
      resizeRaf = null;
      rebuildGeometry();
    });
  }

  rebuildGeometry();

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      inView = entries.some(function (entry) { return entry.isIntersecting; });
      sync();
    }, { threshold: 0.05 });
    observer.observe(grid);
  } else {
    inView = true;
  }

  if ("ResizeObserver" in window) {
    var resizeObserver = new ResizeObserver(queueRebuild);
    resizeObserver.observe(grid);
  } else {
    window.addEventListener("resize", queueRebuild, { passive: true });
  }

  document.addEventListener("visibilitychange", sync);
  window.addEventListener("whisprmotionchange", sync);
  if (typeof reducedMotion.addEventListener === "function") reducedMotion.addEventListener("change", sync);
  else if (typeof reducedMotion.addListener === "function") reducedMotion.addListener(sync);
  sync();
})();

/* ---------- Marquee visibility control ----------
   The app and company marquees are CSS transports paused by default. JS
   marks each [data-marquee] as running only while it is visible, the tab is
   active, reduced motion is not requested, and the user has not paused it. */
(function () {
  "use strict";

  var marquees = Array.prototype.slice.call(document.querySelectorAll("[data-marquee]"));
  if (!marquees.length) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var visible = marquees.map(function () { return false; });

  function apply() {
    marquees.forEach(function (element, index) {
      var run = visible[index] && !document.hidden && !reducedMotion.matches
        && !document.body.classList.contains("motion-paused");
      element.classList.toggle("is-running", run);
    });
  }

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var index = marquees.indexOf(entry.target);
        if (index !== -1) visible[index] = entry.isIntersecting;
      });
      apply();
    }, { threshold: 0.05 });
    marquees.forEach(function (element) { observer.observe(element); });
  } else {
    visible = marquees.map(function () { return true; });
    apply();
  }

  document.addEventListener("visibilitychange", apply);
  window.addEventListener("whisprmotionchange", apply);
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", apply);
  } else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(apply);
  }
})();

/* ---------- Hero avatar visibility control ----------
   CSS animation is paused by default. Run the mouth loop only while the hero
   is visible, the document is active, and motion has not been paused. */
(function () {
  "use strict";

  var avatar = document.querySelector(".hero-avatar");
  if (!avatar) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var inView = false;

  function sync() {
    var run = inView && !document.hidden && !reducedMotion.matches
      && !document.body.classList.contains("motion-paused");
    avatar.classList.toggle("is-motion-active", run);
    Array.prototype.forEach.call(
      avatar.querySelectorAll(".hero-avatar-mouth-open, .hero-avatar-lower-lip"),
      function (part) {
        if (typeof part.getAnimations !== "function") return;
        part.getAnimations().forEach(function (animation) {
          if (run) animation.play();
          else animation.pause();
        });
      }
    );
  }

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      inView = entries.some(function (entry) { return entry.isIntersecting; });
      sync();
    }, { threshold: 0.05 });
    observer.observe(avatar);
  } else {
    inView = true;
    sync();
  }

  document.addEventListener("visibilitychange", sync);
  window.addEventListener("whisprmotionchange", sync);
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", sync);
  } else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(sync);
  }
})();
