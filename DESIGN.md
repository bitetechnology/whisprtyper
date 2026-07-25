---
version: 1.0.0
name: WhisprTyper Liquid Glass
product: WhisprTyper
colors:
  primary: "#1D1D1F"
  secondary: "#4C4A46"
  accent: "#6F63E0"
  canvas: "#F7F4ED"
  surface: "#FFFFFF"
typography:
  family: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, sans-serif"
  navLabel:
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.2
rounded:
  sm: 7px
  md: 20px
  lg: 28px
  pill: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 18px
  lg: 24px
components:
  glass-standard-nav:
    backgroundColor: "#F1EFEA"
    textColor: "#1D1D1F"
    rounded: "{rounded.pill}"
    minControlHeight: 44px
  nav-primary-cta:
    backgroundColor: "#1D1D1F"
    textColor: "#F7F4ED"
    rounded: "{rounded.pill}"
    minControlHeight: 44px
  hero-strong-pill:
    backgroundColor: "rgba(22, 21, 19, 0.94)"
    textColor: "#F7F7EB"
    rounded: "{rounded.pill}"
    blur: 14px
    scale: 1.35
  hero-word-fragment:
    textColor: "#4C4A46"
    fontSize: 15px
  hero-finalized-ribbon:
    backgroundColor: "#1A1A1C"
    textColor: "#F7F7EB"
    rounded: 18px
    fontSize: 15px
---

# WhisprTyper Design Contract

## Product and conversion

- Audience: Mac users who write messages, documents, support replies, and prose.
- Offer: private-by-default voice typing for supported editable fields.
- Primary CTA: **Get the app**.
- Proof: on-device WhisperKit by default, exact app interaction preview, no account, no transcript history.
- Prohibited claims: universal insertion, password-field support, or a live downloadable build before signing and notarization pass.

## Liquid Glass hierarchy

- **Standard:** the persistent navbar capsule. It uses a translucent warm fill, 24px blur, restrained saturation, luminous hairline edge, inner top/left highlight, and ambient shadow.
- **Strong:** the hero word-flow capsule (dark, near-opaque, 14px blur), plus dense copy and transactional content, which remain opaque or strongly frosted. The page itself never becomes glass.
- **Subtle:** decorative badges and compact overlays only.
- The full viewport header must remain transparent; the glass boundary belongs to the capsule itself.

## Hero geometry and word-flow stage

- Desktop hero is near-full-viewport (`min-height: 100svh` minus the sticky nav allowance) but content-height safe: min-height only, flex-centered, never fixed height, and never behind the navbar.
- Headline scales to `clamp(44px, 8.2vw, 94px)`; eyebrow, subcopy, CTA pair, exact download URL, and the platform note are unchanged.
- Below the note sits a clipped motion stage (`overflow: hidden`, 28px radius, `clamp(280px, 36vh, 400px)` tall on desktop) with two faint dotted cubic-Bézier guide paths in a normalized 0–100 viewBox: incoming `M 2 72 C 22 72 32 52 50 52`, outgoing `M 50 52 C 68 52 78 72 98 72`.
- The stage narrative is product truth only: lower-case spoken fragments (“just finished … after lunch”) travel the incoming curve into the pill; the finalized punctuated sentence (“Just finished the draft. I can send it over after lunch.”) exits the outgoing curve. It shows transcription finalization and insertion — never rewriting, grammar correction, summarization, cloud AI, or live website dictation.
- The hero capsule is the **strong/dark glass** tier (`hero-strong-pill`): near-opaque dark fill, 14px blur over the dotted paths beneath it, top-lit 1px rim, ambient shadow, at 1.35× the app pill geometry. The page canvas itself stays warm paper — the glass boundary belongs to the capsule, not the section.
- Stage visuals are `aria-hidden` and non-interactive; the product relationship is stated in a visible figcaption and the small "You say" / "WhisprTyper types" tags (12px minimum). Hero fragment, tag, label, and caption text uses `--ink-soft` (#4C4A46) for at least WCAG AA contrast on the paper canvas.
- At 390px the stage keeps the left-fragments → centered pill → right-sentence layout with fewer fragments, a 1.05× pill, and a widened ribbon lowered behind the pill inside the clip; the redundant dynamic status label is omitted and there is no horizontal page overflow.

## Navbar geometry

- Desktop: one centered pill, maximum 1200px, minimum 44px controls, 999px radius.
- Mobile: the same material becomes a two-row rounded capsule; no links or CTA are removed.
- Brand, navigation links, and CTA remain semantic HTML.
- Focus rings must follow each control’s pill geometry.

## Fallbacks

- `prefers-reduced-transparency`: use an opaque warm surface and remove backdrop filtering; the hero pill becomes solid `#1F1E1B`.
- `forced-colors`: use system Canvas/CanvasText and a visible solid border; hero curves, fragments, pill, and ribbon all redraw in CanvasText on Canvas.
- `prefers-reduced-motion`: the hero stage renders its complete static diagram (fragments on the curve, waveform pill, docked finalized sentence); no loop runs.
- No JavaScript: the same static diagram is served in markup; nothing in the hero is hidden until scripts load.
- Print: make the header static and opaque.

## Visual restraint

No rainbow rim, neon glow, cursor-following lens, distortion shader, or unrelated scroll animation. The material depth comes from fill, blur, edge, inner light, and shadow—not blur alone.
