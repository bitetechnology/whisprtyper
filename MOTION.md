# WhisprTyper Motion Brief

## Purpose

- Product: WhisprTyper marketing website
- Audience: Mac users seeking fast, private voice typing
- Message: natural speech becomes a finalized transcript typed into the field you were using; the navbar stays calm and premium
- Primary CTA: Get the app
- Canonical source: semantic HTML in `index.html`

## Story

The site's motion is coordinated and intentional. Beyond the hero loop, three lighter decorative motions exist and are called out here for honesty:

1. **Persistent glass navbar** — a stable floating Liquid Glass capsule while the page moves beneath it. Only direct hover, focus, and press interactions change control surfaces; scrolling triggers no choreography.
2. **Hero word-flow** — an atmospheric, looped explanation of the product: an editorial sentence ("Just finished the draft. I can send it over after lunch.") types out letter by letter along a 2D wave — it rises and falls a couple of times, then flattens — and the whole sentence settles into a strong dark glass pill; the pill listens (waveform), finalizes (spinner), and confirms insertion (check) while the finished punctuated sentence docks to the right of the pill. It illustrates transcription finalization and insertion only; no rewriting, grammar correction, summarization, or cloud AI is implied, and the page never requests microphone access. The interactive `#product` demo below the hero remains the page's only product *interaction*.
3. **Supporting decorative motion (truthful inventory, not "nothing else"):** section scroll-reveal (`reveal-in`) on non-hero content; a small animated waveform beside the "Hold. Talk. Let go." step in *How it works* (`.step-key-wave`); and a blinking text caret shown during the `#product` demo's inserted state. All three respect `prefers-reduced-motion: reduce`. None imply transcription, rewriting, or microphone use.

## Hero timeline (normalized over one 9.0s loop)

| Range | State | Pill | What moves | Acceptance criterion |
|---:|---|---|---|---|
| 0.00–0.74 | `listening` | waveform | the editorial sentence types out letter by letter along the 2D wave, each letter lighting on the curve as a blinking caret advances; the whole sentence settles into the pill at the wave's flat end | letters appear sequentially; wave rises/falls then flattens into the pill |
| 0.74–0.84 | `finalizing` | spinner | nothing new types; in-wave letters fade as the docked sentence takes over | the typed sentence does not move during finalizing |
| 0.84–0.96 | `inserted` | check | finalized sentence sits docked to the right of the pill | sentence is the punctuated editorial version |
| 0.96–1.00 | `reset` | waveform | docked sentence fades; loop restarts | loop is seamless and deterministic |

## Render decision

- **CSS** renders all materials (pill glass, ribbon, chips) and the pill waveform/spinner keyframes.
- **Inline SVG** draws a single faint dotted 2D-wave guide path in a normalized 0–100 viewBox (`preserveAspectRatio="none"` + non-scaling stroke, so the curve stretches with the stage) and supplies `getPointAtLength` sampling so each letter can be placed along the wave. The wave oscillates a couple of times then flattens into the pill at its center.
- **JS** (`script.js`, own module) runs one deterministic `requestAnimationFrame` loop that maps normalized time to path positions via CSS custom properties (`--x`/`--y`/`--o`) and switches the pill `data-state`.
- No canvas, WebGL, Rive, video, frame sequences, external libraries, or generated media.

## Scheduling and idle behavior

- The hero rAF loop runs **only** while the stage is intersecting (IntersectionObserver), the document is visible (`visibilitychange`), and reduced motion is not requested. Offscreen or hidden, the loop is cancelled — no perpetual work.
- The pill's CSS waveform animation is gated behind the `is-animated` class the loop adds, so the static diagram never animates on its own. The hero finalizing spinner is likewise gated behind `.hero-stage.is-animated`; when the stage leaves the viewport the spinner stops too. The interactive `#product` demo spinner animates independently under finalizing because that preview is a deliberate user-triggered interaction, not ambient background motion.

## Desktop

- Hero is near-full-viewport (min-height only; content-height safe), stage `clamp(280px, 36vh, 400px)` tall, clipped with `overflow: hidden`; zero page-level horizontal overflow.
- Sticky navbar offset 10px, one-row pill, all controls at least 44px tall, no scroll-linked transforms.

## Mobile (390px)

- Same stage, taller relative curves, two letters hidden (`data-i="0"`/2 masked), pill at 1.05×, and a compact finalized ribbon lowered behind the pill inside the clip. The redundant dynamic status label is hidden; the visible relationship tags remain. It still reads as left text on the wave → centered pill → right finalized text.
- Navbar keeps the same material and content in a two-row rounded capsule; no links or CTA removed.

## Accessibility and fallbacks

- Reduced motion: the stage shows the complete static diagram — the full editorial sentence laid out along the wave, static waveform pill, docked finalized sentence. No loop runs; a runtime preference change tears the loop down and restores the diagram.
- Reduced transparency: opaque navbar surface; hero pill becomes solid dark.
- Forced colors: system Canvas/CanvasText for navbar, curves, letters, pill, and ribbon.
- No JavaScript: the identical static diagram is served in markup; nothing in the hero is hidden until scripts run.
- The animation is never the only explanation: the visible figcaption and the “You say” / “WhisprTyper types” tags state the relationship in text (≥12px). The whole stage is `aria-hidden` and non-interactive, so it adds no screen-reader noise.
- Keyboard: semantic links and visible pill-shaped focus rings throughout; hero adds no focus stops.

## Verification

- [ ] Desktop and 390px mobile have no horizontal overflow
- [ ] Every nav control is at least 44px high
- [ ] Contrast remains readable over hero and scrolled content
- [ ] Reduced-motion, reduced-transparency, and forced-colors fallbacks exist
- [ ] No rAF ticks while the hero is offscreen or the tab is hidden
- [ ] The site never requests microphone access
- [ ] Browser console remains clean
