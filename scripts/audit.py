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

# --- Hero continuous through-pill scene -----------------------------------
check("hero stage exists", 'id="hero-stage"' in index and 'aria-hidden="true"' in index)
check("hero shared flow path exists", 'id="hero-path"' in index)
check("hero input/output clips exist",
      'id="hero-clip-in"' in index and 'id="hero-clip-out"' in index)
check("black output ribbon reuses the shared path",
      'class="hero-ribbon" href="#hero-path"' in index)
check("hero pill exists with waveform state",
      re.search(r'class="voice-pill hero-pill" data-state="recording"', index) is not None)
TRANSCRIPT = (
    "I think the new timeline should be ready by Friday, although it might "
    "slip a little, so can you check in with the team and see if the notes "
    "from yesterday's meeting were sent out, or if they are still waiting."
)

hero_svg_match = re.search(r'<svg class="stage-curves".*?</svg>', index, re.S)
check("hero SVG stage block present", hero_svg_match is not None)
hero_svg = hero_svg_match.group(0) if hero_svg_match else ""

copy_nodes = re.findall(
    r'<text class="hero-sentence-copy hero-sentence-(in|out)">\s*'
    r'<textPath href="#hero-path" startOffset="([^"]+)">([^<]+)</textPath>\s*</text>',
    hero_svg,
)
check("four rendered sentence layers exist", len(copy_nodes) == 4, f"found {len(copy_nodes)}")
check("two input and two output copies exist",
      [kind for kind, _, _ in copy_nodes].count("in") == 2
      and [kind for kind, _, _ in copy_nodes].count("out") == 2)
check("exactly four native textPath nodes use the shared path",
      hero_svg.count('<textPath href="#hero-path"') == 4)
check("every rendered copy contains the exact transcript",
      len(copy_nodes) == 4 and all(text == TRANSCRIPT for _, _, text in copy_nodes))
input_offsets = [offset for kind, offset, _ in copy_nodes if kind == "in"]
output_offsets = [offset for kind, offset, _ in copy_nodes if kind == "out"]
check("authored input and output offsets are paired numeric units",
      input_offsets == output_offsets
      and len(input_offsets) == 2
      and all(re.fullmatch(r"-?\d+(\.\d+)?", value) for value in input_offsets),
      f"input={input_offsets}, output={output_offsets}")
check("no rectangular static hero output remains",
      'class="hero-out"' not in index and ".hero-out" not in styles)
check("hero flow explained in visible text",
      'class="hero-stage-caption"' in index and "same sentence" in index)
check("hero stage/ribbon styles exist", ".hero-stage" in styles and ".hero-ribbon" in styles)
check("hero module exists in script.js", 'getElementById("hero-stage")' in script)

hero_script = script.split("/* ---------- Hero continuous through-pill sentence ribbon ----------", 1)[-1]
check("hero waveform CSS keyframes are disabled",
      '.voice-pill.hero-pill[data-state="recording"] .pill-wave i { animation: none; }' in styles)
check("interactive demo spinner remains independent",
      '.voice-pill[data-state="finalizing"] .pill-spinner' in styles)
check("input and output text use deliberate contrasting fills",
      ".hero-sentence-in { fill: rgba(76, 74, 70, 0.58); }" in styles
      and ".hero-sentence-out { fill: var(--ivory); }" in styles)

# --- Shared-conveyor implementation invariants ----------------------------
check("JS pairs every input offset with the matching output offset",
      'querySelectorAll(".hero-sentence-in")' in script
      and 'querySelectorAll(".hero-sentence-out")' in script
      and "setPairOffset" in script
      and 'inputPaths[index].setAttribute("startOffset", offset)' in script
      and 'outputPaths[index].setAttribute("startOffset", offset)' in script)
check("JS measures one pitch and applies shared modulo transport",
      "getComputedTextLength" in script
      and "pitch = sentenceAdvance" in script
      and "transportPx % cycle" in script
      and "i * pitch" in script)
check("sentence layers remain bold and fully opaque",
      ".hero-sentence-copy {" in styles
      and "opacity: 1;" in styles
      and "font-weight: 700;" in styles
      and ".style.opacity" not in hero_script)
check("output is a black curved ribbon under ivory moving text",
      ".hero-ribbon {" in styles
      and "stroke: #111113;" in styles
      and ".hero-sentence-out { fill: var(--ivory); }" in styles
      and 'clip-path="url(#hero-clip-out)"' in index)
check("pill is light, outlined, and layered over the shared seam",
      ".voice-pill.hero-pill {" in styles
      and "border: 2px solid #111113;" in styles
      and "background: rgba(255, 254, 245, 0.96);" in styles
      and "z-index: 2;" in styles)
check("pill bars and pulse share the text transport clock",
      "function renderWave(transportPx)" in script
      and "bars[i].style.transform" in script
      and 'pill.style.setProperty("--hero-pulse"' in script
      and "renderWave(transportPx)" in script)
check("JS rebuilds responsive valley, clips, and ribbon in CSS pixels",
      "buildFlowPath" in script
      and 'setAttribute("viewBox"' in script
      and "clipInRect.setAttribute" in script
      and "clipOutRect.setAttribute" in script
      and 'ribbon.setAttribute("stroke-width"' in script
      and "ResizeObserver" in script)
check("hero has no phase machine, checkmark, or static output reveal",
      all(token not in hero_script for token in ["var PHASES", "function setOutReveal", "setPill(", "out.style.clipPath"]))
legacy_tokens = ["hero-letter", "hero-word", "wordStarts", 'data-i="']
check("no legacy per-word/per-letter implementation remains",
      all(token not in index and token not in hero_script and token not in styles for token in legacy_tokens))
check("forced-colors preserves output ribbon contrast",
      ".hero-ribbon { stroke: CanvasText; }" in styles
      and ".hero-sentence-out { fill: Canvas; }" in styles)
check("mobile keeps one connected through-pill composition",
      "var compact = width < 560;" in script
      and 'ribbon.setAttribute("stroke-width", compact ? "28" : "34")' in script
      and ".hero-stage { height: clamp(230px, 64vw, 300px); }" in styles)

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
