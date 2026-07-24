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
