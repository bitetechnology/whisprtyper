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
  hero-processing-pill:
    backgroundColor: "rgba(255, 254, 245, 0.96)"
    borderColor: "#111113"
    waveformColor: "#111113"
    rounded: "{rounded.pill}"
    blur: 14px
    scale: 1.35
  hero-sentence-input:
    textColor: "rgba(76, 74, 70, 0.58)"
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, sans-serif"
    fontSize: 16px
    fontWeight: 700
    opacity: 1
  hero-output-ribbon:
    strokeColor: "#111113"
    textColor: "#F7F7EB"
    strokeWidth: 34px
    fontSize: 16px
    fontWeight: 700
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
- **Strong:** the black output ribbon and dense transactional content. The processing pill itself stays warm and outlined so the input/output color transformation is immediately legible. The page itself never becomes glass.
- **Subtle:** decorative badges and compact overlays only.
- The full viewport header must remain transparent; the glass boundary belongs to the capsule itself.

## Hero geometry and word-flow stage

- Desktop hero is near-full-viewport (`min-height: 100svh` minus the sticky nav allowance) but content-height safe: min-height only, flex-centered, never fixed height, and never behind the navbar.
- Headline scales to `clamp(44px, 8.2vw, 94px)`; eyebrow, subcopy, CTA pair, exact download URL, and the platform note are unchanged.
- Below the note sits a clipped motion stage (`overflow: hidden`, 28px radius, `clamp(280px, 36vh, 400px)` tall on desktop). One responsive SVG path forms a shallow valley from off-left, through the measured pill center, to off-right; the runtime viewBox matches rendered CSS pixels so glyphs are never stretched.
- Two identical transcript copies form one continuous conveyor. Each copy is rendered twice on that exact path with identical numeric offsets: muted gray in the input clip, and ivory in the output clip over a 34px black path stroke. The pill masks the clip boundary, so the same words visibly enter and leave it without appearing, fading, or changing order independently.
- The processing pill is warm, outlined `#111113`, and lightly frosted. Its ten dark waveform bars and restrained 1.2% pulse are deterministic functions of the same transport position that moves the sentence—not an unrelated CSS loop.
- Stage visuals are `aria-hidden` and non-interactive; the product relationship is stated in a visible figcaption and the small "You say" / "WhisprTyper types" tags (12px minimum). Tag, label, and caption text uses `--ink-soft` (#4C4A46) for at least WCAG AA contrast on the paper canvas.
- At 390px the same connected through-pill composition remains horizontal. The curve rises less, the ribbon narrows to 28px, and each side shows a shorter contiguous sentence segment without stacking a card below the pill or causing page overflow.

## Navbar geometry

- Desktop: one centered pill, maximum 1200px, minimum 44px controls, 999px radius.
- Mobile: the same material becomes a two-row rounded capsule; no links or CTA are removed.
- Brand, navigation links, and CTA remain semantic HTML.
- Focus rings must follow each control’s pill geometry.

## Fallbacks

- `prefers-reduced-transparency`: use opaque warm surfaces and remove backdrop filtering; the hero pill becomes solid `#FFFEF5` while the output ribbon stays black.
- `forced-colors`: use system Canvas/CanvasText; the output ribbon becomes CanvasText and its moving words become Canvas for guaranteed inversion.
- `prefers-reduced-motion`: the same shared-path diagram remains visible with paired input/output sentence segments and a static waveform; no transport or pulse runs.
- No JavaScript: authored offsets show the same static through-pill diagram directly from markup.
- Print: make the header static and opaque.

## Visual restraint

No rainbow rim, neon glow, cursor-following lens, distortion shader, or unrelated scroll animation. The material depth comes from fill, blur, edge, inner light, and shadow—not blur alone.
