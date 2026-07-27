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

  if (!svg || !pill || !path || !ribbon || !clipInRect || !clipOutRect) return;
  if (inputCopies.length !== 2 || outputCopies.length !== 2 || bars.length === 0) return;
  if (inputPaths.concat(outputPaths).some(function (node) { return !node; })) return;
  if (typeof path.getTotalLength !== "function") return;

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
    var advance = 0;
    if (typeof inputCopies[0].getComputedTextLength === "function") {
      advance = inputCopies[0].getComputedTextLength();
    }
    if (!(advance > 0)) advance = inputCopies[0].textContent.length * copyFontSize() * 0.5;
    sentenceAdvance = advance;
    pitch = sentenceAdvance + copyFontSize() * GAP_EM;
  }

  /* A shallow two-cubic valley matches the reference: muted words descend
     toward the pill, then the same path climbs away under the black ribbon.
     Horizontal tangents at the center keep type calm as it crosses the pill. */
  function buildFlowPath(width, height, centerX, centerY) {
    var compact = width < 560;
    var overshoot = Math.max(compact ? 26 : 64, width * 0.075);
    var inputRise = Math.min(height * (compact ? 0.12 : 0.34), compact ? 36 : 112);
    var outputRise = Math.min(height * (compact ? 0.15 : 0.3), compact ? 44 : 96);
    var startY = Math.max(22, centerY - inputRise);
    var endY = Math.max(22, centerY - outputRise);
    var startX = -overshoot;
    var endX = width + overshoot;
    var leftC1 = width * (compact ? 0.08 : 0.1);
    var leftC2 = centerX * (compact ? 0.68 : 0.62);
    var rightC1 = centerX + (width - centerX) * (compact ? 0.32 : 0.38);
    var rightC2 = width * (compact ? 0.92 : 0.88);

    return "M " + startX.toFixed(2) + " " + startY.toFixed(2)
      + " C " + leftC1.toFixed(2) + " " + startY.toFixed(2)
      + " " + leftC2.toFixed(2) + " " + centerY.toFixed(2)
      + " " + centerX.toFixed(2) + " " + centerY.toFixed(2)
      + " C " + rightC1.toFixed(2) + " " + centerY.toFixed(2)
      + " " + rightC2.toFixed(2) + " " + endY.toFixed(2)
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
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", sync);
  } else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(sync);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(queueGeometryRefresh);
  }
})();
