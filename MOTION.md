# WhisprTyper Motion Brief

## Purpose

The hero is one continuous processing diagram: spoken words descend toward WhisprTyper, pass through an animated processing pill, and continue as the exact same moving sentence in ivory type on a black ribbon.

## Story

**Muted spoken sentence → animated processing pill → identical ivory sentence on black ribbon**

This is not a before/after card transition. Input and output are two color treatments of the same SVG text conveyor on the same path at the same time.

## Composition

- One responsive SVG path starts off-left, forms a shallow valley through the measured pill center, and ends off-right.
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
- Pitch: rendered sentence advance plus `2.4em` separator.
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
- At 390px the valley is shallower and both sides show shorter contiguous sentence segments while remaining visibly connected through the pill.
- The stage clips internally and must not create page-level horizontal overflow.

## Scheduling

- `requestAnimationFrame` runs only when the stage intersects the viewport, the document is visible, and reduced motion is not requested.
- `ResizeObserver` refreshes geometry.
- Frame deltas are capped at `250ms` after suspension.
- No microphone, audio context, speech-recognition API, canvas, WebGL, or external motion library is used.

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
