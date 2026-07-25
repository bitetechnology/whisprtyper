#!/usr/bin/env python3
"""Structural audit for the WhisprTyper site.

Deterministic, stdlib-only checks for the invariants the pages must keep:
exact download links, truthful platform/messaging copy, the hero word-flow
scene, and the absence of forbidden claims or microphone APIs.

Run from the repository root:  python3 scripts/audit.py
Exits non-zero if any check fails.
"""

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOWNLOAD_URL = (
    "https://github.com/bitetechnology/whisprtyper/releases/download/"
    "v1.0.0/WhisprTyper-1.0.zip"
)
ORIGIN = "https://whisprtyper.vercel.app"

failures = []


def check(name, ok, detail=""):
    print(("PASS  " if ok else "FAIL  ") + name + (f"  ({detail})" if detail and not ok else ""))
    if not ok:
        failures.append(name)


index = (ROOT / "index.html").read_text(encoding="utf-8")
script = (ROOT / "script.js").read_text(encoding="utf-8")
styles = (ROOT / "styles.css").read_text(encoding="utf-8")

# --- Download links -------------------------------------------------------
href_count = index.count(f'href="{DOWNLOAD_URL}"')
check("seven exact download hrefs in index.html", href_count == 7, f"found {href_count}")

jsonld_match = re.search(
    r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>', index, re.S
)
check("JSON-LD block present", jsonld_match is not None)
if jsonld_match:
    try:
        data = json.loads(jsonld_match.group(1))
        check("JSON-LD parses", True)
        check("JSON-LD downloadUrl exact", data.get("downloadUrl") == DOWNLOAD_URL)
        check("JSON-LD url is canonical origin", data.get("url") == ORIGIN + "/")
    except json.JSONDecodeError as err:
        check("JSON-LD parses", False, str(err))

check(
    "no mutated download URLs",
    not re.search(r"whisprtyper/releases/download/(?!v1\.0\.0/WhisprTyper-1\.0\.zip)", index),
)
check("canonical link is live origin", f'<link rel="canonical" href="{ORIGIN}/">' in index)

# --- Platform / channel messaging ----------------------------------------
check("Apple Silicon messaging present", "Apple Silicon" in index)
check("macOS 14+ messaging present", "macOS 14+" in index or "macOS&nbsp;14" in index)
check("Mac App Store coming soon", "Coming soon" in index and "Mac App Store" in index)
check("manual direct updates messaging", "Direct-download updates are currently manual." in index)
intel_hits = re.findall(r"\bIntel\b", index, re.I)
check(
    "Intel appears only as the truthful negation",
    len(intel_hits) == 1 and "there is no Intel, Windows, iPhone, or iPad version" in index,
    f"found {len(intel_hits)} occurrence(s)",
)

# --- Hero word-flow scene -------------------------------------------------
check("hero stage exists", 'id="hero-stage"' in index and 'aria-hidden="true"' in index)
check("hero spiral path exists", 'id="hero-path"' in index)
check("hero pills uses single spiral path (no legacy in/out paths)",
      'id="hero-path-in"' not in index and 'id="hero-path-out"' not in index)
check("hero pill exists with default recording state",
      re.search(r'class="voice-pill hero-pill" data-state="recording"', index) is not None)
for fragment in ["just finished", "the draft", "i can send", "it over", "after lunch"]:
    check(f'fragment "{fragment}" present', f">{fragment}</span>" in index)
check(
    "finalized sentence exact",
    "Just finished the draft. I can send it over after lunch.</span>" in index,
)
check("hero figcaption explains the flow in text", 'class="hero-stage-caption"' in index)
check("hero stage styles exist", ".hero-stage" in styles and ".hero-out" in styles)
check("hero module exists in script.js", 'getElementById("hero-stage")' in script)

# --- Hero offscreen / contrast invariants (from independent review) --------
check(
    "hero spinner gated behind is-animated (stops offscreen)",
    ".hero-stage.is-animated .voice-pill.hero-pill[data-state=\"finalizing\"] .pill-spinner" in styles,
)
check(
    "hero spinner disabled by default (no perpetual offscreen spin)",
    ".voice-pill.hero-pill[data-state=\"finalizing\"] .pill-spinner { animation: none;" in styles,
)
check(
    "interactive demo spinner still independent of hero is-animated",
    ".voice-pill:not(.hero-pill)[data-state=\"finalizing\"] .pill-spinner" in styles,
)
check(
    "hero fragment/tag/label/caption use AA token --ink-soft",
    ".hero-word {\n  position: absolute;" in styles
    and "color: var(--ink-soft);" in styles
    and ".hero-stage-caption {" in styles,
)

# --- Forbidden claims and APIs -------------------------------------------
FORBIDDEN = [
    r"rewrit", r"\bpolish", r"grammar", r"summariz",
    r"auto-?update", r"automatic(ally)? update", r"updates automatically",
    r"cloud[ -]?ai", r"dictate (right )?here", r"try it in your browser",
]
for pattern in FORBIDDEN:
    hits = re.findall(pattern, index, re.I)
    check(f"no forbidden copy /{pattern}/", not hits, f"found {hits}")

for name, text in [("index.html", index), ("script.js", script)]:
    for api in ["getUserMedia", "mediaDevices", "AudioContext", "SpeechRecognition"]:
        check(f"no {api} in {name}", api not in text)

# --- Other pages keep their invariants ------------------------------------
for page in ["privacy.html", "support.html"]:
    text = (ROOT / page).read_text(encoding="utf-8")
    check(f"{page} keeps canonical origin", ORIGIN in text)

print()
if failures:
    print(f"{len(failures)} check(s) FAILED")
    sys.exit(1)
print("All checks passed.")
