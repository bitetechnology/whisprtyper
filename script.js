/* WhisprTyper site — progressive enhancement only.
   Everything below is optional polish; the page is fully usable without it. */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Use-case tabs ---------- */
  var tabsRoot = document.querySelector("[data-tabs]");
  if (tabsRoot) {
    var tabs = Array.prototype.slice.call(tabsRoot.querySelectorAll('[role="tab"]'));
    var panels = Array.prototype.slice.call(tabsRoot.querySelectorAll('[role="tabpanel"]'));

    var selectTab = function (tab, focus) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute("aria-selected", selected ? "true" : "false");
        t.tabIndex = selected ? 0 : -1;
      });
      panels.forEach(function (p) {
        p.hidden = p.id !== tab.getAttribute("aria-controls");
      });
      if (focus) tab.focus();
    };

    tabs.forEach(function (tab, i) {
      tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;
      tab.addEventListener("click", function () {
        selectTab(tab, false);
      });
      tab.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          next = tabs[(i + 1) % tabs.length];
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          next = tabs[(i - 1 + tabs.length) % tabs.length];
        } else if (event.key === "Home") {
          next = tabs[0];
        } else if (event.key === "End") {
          next = tabs[tabs.length - 1];
        }
        if (next) {
          event.preventDefault();
          selectTab(next, true);
        }
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
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
    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealElements.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------- Demo: type the transcript when the stage scrolls into view ---------- */
  var typed = document.querySelector(".demo-typed");
  if (typed && "IntersectionObserver" in window && !reducedMotion.matches) {
    var fullText = typed.getAttribute("data-demo-text") || typed.textContent;
    var started = false;

    var typeOut = function () {
      var index = 0;
      typed.textContent = "";
      var step = function () {
        if (index >= fullText.length) return;
        // Insert a whole word at a time — transcription arrives in words, not keystrokes.
        var nextSpace = fullText.indexOf(" ", index + 1);
        var end = nextSpace === -1 ? fullText.length : nextSpace;
        typed.textContent = fullText.slice(0, end);
        index = end;
        window.setTimeout(step, 90 + Math.random() * 140);
      };
      window.setTimeout(step, 500);
    };

    var demoObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !started) {
            started = true;
            typeOut();
            demoObserver.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    demoObserver.observe(typed);
  }
})();
