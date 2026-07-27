# WhisprTyper Motion Brief

## Purpose

The first view is intentionally minimal: **“Type faster with your voice.”**, one **Download for Mac** CTA, and one continuous processing diagram. Spoken words descend toward WhisprTyper, pass through an animated processing pill, and continue as the exact same moving sentence in ivory type on a black ribbon.

No eyebrow, explanatory paragraph, secondary CTA, compatibility note, animation label, side tag, or caption appears in the hero. The title communicates the product; the animation demonstrates it.

## Story

**Muted spoken sentence → animated processing pill → identical ivory sentence on black ribbon**

This is not a before/after card transition. Input and output are two color treatments of the same SVG text conveyor on the same path at the same time.

## Composition

- One responsive SVG path runs full-bleed from off-left to off-right as a restrained, shallow, non-self-intersecting S. It has no entry hook, abrupt crest, or opposing steep arcs; it crosses the measured pill center with low vertical excursion so moving text remains easy to scan.
- Two complete identical transcript copies, separated by one measured pitch, create a seamless loop.
- Each copy is rendered twice with the exact same numeric `startOffset`:
  - input layer: muted gray, clipped left of the pill;
  - output layer: ivory, clipped right of the pill.
- A 34px black stroke of the shared path is clipped to the output side beneath the ivory text.
- The warm outlined pill sits above both clips and masks the color boundary.
- The exact transcript remains:

> I think the new timeline should be ready by Friday, although it might slip a little, so can you check in with the team and see if the notes from yesterday's meeting were sent out, or if they are still waiting.

## Transport

- Speed: `78 CSS px/s`.
- Pitch: full intrinsic sentence advance measured by an unpathed off-canvas SVG text probe, plus `2.4em` separator. Do not derive pitch from a live `textPath`: WebKit reports only its visible portion and causes repeated-copy overlap.
- Every input/output pair receives the same offset each frame.
- All sentence layers stay at opacity `1`; there is no per-word or per-letter reveal.
- Copy wrapping is modulo two pitches and swaps identical content invisibly.

## Pill response

- The hero never enters a checkmark or spinner phase.
- Ten waveform bars are scaled in JavaScript from deterministic sine components driven by the same `transportPx` value used for the text.
- A restrained pill pulse ranges from `1.000` to `1.012`, also derived from that transport value.
- Hero waveform CSS keyframes are disabled so the pill cannot drift out of synchronization.

## Responsive geometry

- SVG viewBox equals the rendered stage in CSS pixels; glyphs are never non-uniformly scaled.
- Clip rectangles and ribbon width are rebuilt after resize.
- Desktop ribbon: `34px`; mobile ribbon: `28px`.
- At 390px the hero occupies the viewport below the two-row nav and keeps the next section below the fold. The stage sits at the bottom of that space; the valley is shallower and both sides show shorter contiguous sentence segments while remaining visibly connected through the pill.
- The stage clips internally and must not create page-level horizontal overflow.

## Scheduling

- `requestAnimationFrame` runs only when the stage intersects the viewport, the document is visible, reduced motion is not requested, and the user has not paused automatic motion.
- The persistent pause/resume control stops the hero, app train, company logo marquee, and WPM conveyor together.
- `ResizeObserver` refreshes geometry.
- Frame deltas are capped at `250ms` after suspension.
- No microphone, audio context, speech-recognition API, canvas, WebGL, or external motion library is used.

## Hero speaking avatar

- One original inline SVG editorial bust faces right immediately above the hero pill, in front of a single flat pastel backdrop blob that never moves.
- Only the mouth cavity, tongue, and lower lip animate. No head bob, blinking, arm movement, backdrop motion, or full-body motion is permitted.
- The speaking loop uses short irregular mouth openings over `1.7s`; the silhouette and thick outline remain stable.
- User pause freezes the current mouth frame. Reduced motion and print show the mouth closed.
- The CSS loop is paused by default and runs only while the avatar intersects the viewport, the document is visible, reduced motion is off, and the global pause is inactive.
- The SVG is decorative (`aria-hidden="true"`) because the adjacent hero title and control already communicate the feature.

## WPM shared-path comparison

- One SVG path spans the complete 30/70 keyboard/voice grid. Side-by-side cards use a shallow bridge; stacked cards use a broad soft S with a Keyboard top leg, contained right bend, wide leftward return in the Voice card, and low Voice exit leg. The return and exit centerlines stay ~118px apart inside the Voice card's reserved bottom band, both below its copy, so the thick stroke never merges into a U outline.
- Individual word particles travel on that one path. They use a slow local velocity in the 45 WPM region and smoothly accelerate after entering the 220 WPM region (ramp start measured from the Voice card entry). The local tangent is computed in every layout: side-by-side words tilt along it, while stacked labels stay at `rotate(0)` and use it only to fade nearly out on near-vertical connectors, in addition to the clipped-endpoint fade.
- The animation runs only while intersecting, visible, motion-allowed, and not user-paused. Reduced motion uses dynamically measured static geometry. Without JavaScript, the authored path remains on side-by-side desktop cards; stacked layouts hide the fixed-aspect overlay and keep the complete 45/220 metric cards and explanatory copy.

## Fallbacks

- **Reduced motion:** transport and pulse stop; authored paired offsets show a static through-pill diagram.
- **No JavaScript:** the same static diagram is present in markup.
- **Reduced transparency:** the pill becomes opaque warm `#FFFEF5`; ribbon remains black.
- **Forced colors:** ribbon uses `CanvasText`, output text uses `Canvas`, and input/pill use system colors.
- **Offscreen or hidden tab:** the rAF loop is cancelled and hero waveform keyframes remain disabled.

## Verification checklist

- [ ] Input and output pairs have identical runtime offsets at every sample
- [ ] Sentence copies remain opaque and move with one shared delta
- [ ] Shared path crosses the measured pill center
- [ ] Black ribbon starts beneath the pill and follows the exact output path
- [ ] Pill bars and pulse change while the sentence moves
- [ ] Desktop and 390px screenshots show a connected through-pill composition
- [ ] Reduced motion is static and complete
- [ ] No horizontal overflow or console errors
