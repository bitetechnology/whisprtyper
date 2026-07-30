#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SCRIPT_PATH = path.join(__dirname, "..", "script.js");
const HERO_MARKER = "/* ---------- Hero continuous through-pill sentence ribbon ----------";

function createTimers() {
  let now = 0;
  let nextId = 1;
  const pending = new Map();

  function setTimeoutFake(callback, delay) {
    const id = nextId++;
    pending.set(id, { callback, due: now + Number(delay || 0) });
    return id;
  }

  function clearTimeoutFake(id) {
    pending.delete(id);
  }

  function advance(milliseconds) {
    const target = now + milliseconds;
    while (true) {
      let next = null;
      for (const [id, timer] of pending) {
        if (timer.due <= target && (!next || timer.due < next.timer.due ||
            (timer.due === next.timer.due && id < next.id))) {
          next = { id, timer };
        }
      }
      if (!next) break;
      pending.delete(next.id);
      now = next.timer.due;
      next.timer.callback();
    }
    now = target;
  }

  return { advance, clearTimeoutFake, setTimeoutFake };
}

function createElement(attributes) {
  const listeners = new Map();
  const values = Object.assign({}, attributes);
  return {
    addEventListener(type, callback) {
      listeners.set(type, callback);
    },
    dispatch(type, event) {
      const callback = listeners.get(type);
      assert.ok(callback, `missing ${type} listener`);
      callback(event);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(values, name) ? values[name] : null;
    },
    setAttribute(name, value) {
      values[name] = String(value);
    }
  };
}

function createHarness() {
  const timers = createTimers();
  const events = [];
  const demo = createElement();
  const pill = createElement({ "data-state": "idle" });
  const input = createElement({
    "data-transcript": "Private preview transcript that must never be tracked"
  });
  input.value = "";
  const status = createElement();
  status.textContent = "";

  const documentListeners = new Map();
  const document = {
    hidden: false,
    addEventListener(type, callback) {
      documentListeners.set(type, callback);
    },
    getElementById() {
      return null;
    },
    querySelector(selector) {
      return {
        "#voice-demo": demo,
        "#demo-pill": pill,
        "#demo-input": input,
        "#demo-status": status
      }[selector] || null;
    },
    querySelectorAll(selector) {
      if (selector === ".reveal" || selector === "a.button[href]") return [];
      return [];
    }
  };

  const window = {
    addEventListener() {},
    clearTimeout: timers.clearTimeoutFake,
    document,
    matchMedia() {
      return { matches: false };
    },
    setTimeout: timers.setTimeoutFake,
    umami: {
      track(name, data) {
        events.push({ data, name });
      }
    }
  };
  window.window = window;

  const source = fs.readFileSync(SCRIPT_PATH, "utf8");
  const heroOffset = source.indexOf(HERO_MARKER);
  assert.notEqual(heroOffset, -1, "hero marker missing from script.js");
  vm.runInNewContext(source.slice(0, heroOffset), {
    console,
    document,
    Event: function Event(type) { this.type = type; },
    window
  }, { filename: SCRIPT_PATH });

  function pointerEvent() {
    return {
      button: 0,
      isPrimary: true,
      pointerId: 1,
      preventDefault() {
        this.defaultPrevented = true;
      }
    };
  }

  return { events, input, pill, pointerEvent, timers, window };
}

function eventNames(events) {
  return events.map((event) => event.name);
}

{
  const harness = createHarness();
  harness.pill.dispatch("pointerdown", harness.pointerEvent());
  harness.timers.advance(3000);
  assert.deepEqual(
    eventNames(harness.events),
    ["cta_click"],
    "an active recording state must not be misclassified as a timeout"
  );

  harness.pill.dispatch("pointerup", harness.pointerEvent());
  harness.timers.advance(800);
  assert.deepEqual(eventNames(harness.events), ["cta_click", "cta_success"]);
  assert.equal(harness.input.value, "Private preview transcript that must never be tracked");
  assert.deepEqual(Object.keys(harness.events[0].data), ["cta"]);
}

{
  const harness = createHarness();
  const outcome = harness.window.whisprAnalytics.beginCta("test_timeout", 1200);
  outcome.waitForResult();
  harness.timers.advance(1200);
  assert.deepEqual(eventNames(harness.events), ["cta_click", "cta_timeout"]);
}

{
  const harness = createHarness();
  const outcome = harness.window.whisprAnalytics.beginCta("test_error", 1200);
  outcome.waitForResult();
  outcome.error();
  harness.timers.advance(1200);
  assert.deepEqual(eventNames(harness.events), ["cta_click", "cta_error"]);
}

console.log("Analytics behavior tests passed.");
