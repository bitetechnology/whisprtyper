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
  var activeOwner = null;
  var finalTimer = null;
  var autoTimers = [];
  var userInteracted = false;
  var demoInView = false;
  var autoScheduled = false;
  var previousValue = input.value;

  function clearAutoTimers() {
    autoTimers.forEach(function (timer) { window.clearTimeout(timer); });
    autoTimers = [];
  }

  function setState(state) {
    pill.setAttribute("data-state", state);
    pill.setAttribute("aria-busy", state === "finalizing" ? "true" : "false");
    if (state === "recording") {
      pill.setAttribute("aria-label", "Release to finish the dictation preview");
    } else if (state === "finalizing") {
      pill.setAttribute("aria-label", "Finalizing and inserting the preview transcript");
    } else {
      pill.setAttribute("aria-label", "Press and hold to preview dictation");
    }
  }

  function startPreview(owner) {
    if (activeOwner) return;
    if (owner !== "auto") {
      userInteracted = true;
      clearAutoTimers();
    }
    if (finalTimer) {
      window.clearTimeout(finalTimer);
      finalTimer = null;
    }
    activeOwner = owner;
    previousValue = input.value;
    input.value = "";
    setState("recording");
    status.textContent = "Listening… release to finish.";
  }

  function completePreview() {
    input.value = transcript;
    setState("idle");
    status.textContent = "Inserted in the original field. Hold again to replay.";
    activeOwner = null;
    finalTimer = null;
  }

  function finishPreview(owner) {
    if (!activeOwner || (owner && owner !== activeOwner)) return;
    setState("finalizing");
    status.textContent = "Finalizing and inserting…";
    finalTimer = window.setTimeout(completePreview, 800);
  }

  function cancelPreview() {
    if (!activeOwner) return;
    if (finalTimer) {
      window.clearTimeout(finalTimer);
      finalTimer = null;
    }
    input.value = previousValue;
    setState("idle");
    status.textContent = "Preview cancelled because Control was used in a shortcut.";
    activeOwner = null;
  }

  pill.addEventListener("pointerdown", function (event) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    if (pill.setPointerCapture) {
      try { pill.setPointerCapture(event.pointerId); } catch (_) { /* Older browsers may refuse capture. */ }
    }
    startPreview("pointer");
  });
  pill.addEventListener("pointerup", function (event) {
    event.preventDefault();
    finishPreview("pointer");
  });
  pill.addEventListener("pointercancel", function () {
    finishPreview("pointer");
  });
  pill.addEventListener("click", function (event) {
    event.preventDefault();
  });

  pill.addEventListener("keydown", function (event) {
    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
      event.preventDefault();
      startPreview("button-key");
    }
  });
  pill.addEventListener("keyup", function (event) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      finishPreview("button-key");
    }
  });

  document.addEventListener("keydown", function (event) {
    if (activeOwner === "control" && event.key !== "Control") {
      cancelPreview();
      return;
    }
    if (event.key !== "Control" || event.repeat || event.altKey || event.metaKey || event.shiftKey) return;
    if (!demoInView) return;
    startPreview("control");
  });
  document.addEventListener("keyup", function (event) {
    if (event.key === "Control") finishPreview("control");
  });

  if ("IntersectionObserver" in window) {
    var demoObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          demoInView = entry.isIntersecting;
          if (!entry.isIntersecting || userInteracted || reducedMotion.matches || autoScheduled) return;
          autoScheduled = true;
          autoTimers.push(window.setTimeout(function () { startPreview("auto"); }, 550));
          autoTimers.push(window.setTimeout(function () { finishPreview("auto"); }, 2250));
        });
      },
      { threshold: 0.45 }
    );
    demoObserver.observe(demo);
  } else {
    demoInView = true;
  }
})();
