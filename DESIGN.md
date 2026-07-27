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

- Desktop hero fills the viewport below the 60px sticky-nav allowance (`min-height: calc(100svh - 60px)`) but remains content-height safe: min-height only, flex-centered, never fixed height, and never behind the navbar.
- The first view is deliberately title-led: the exact headline is **“Type faster with your voice.”**, followed by one primary **Download for Mac** CTA using the verified release URL. There is no eyebrow, subcopy, secondary CTA, compatibility note, stage label, stage tag, or figure caption competing with that message.
- The headline scales to `clamp(44px, 8.2vw, 94px)`. The motion stage follows after `clamp(22px, 3.5vh, 38px)` so the demonstration remains visible without a large dead zone.
- The clipped motion stage (`overflow: hidden`, `clamp(280px, 36vh, 400px)` tall on desktop) is full-bleed across the viewport while its title and CTA stay within the content gutter. Its responsive SVG path begins with one shallow, non-self-intersecting entry hook, crosses the measured pill center, and ends off-right; the runtime viewBox matches rendered CSS pixels so glyphs are never stretched.
- Two identical transcript copies form one continuous conveyor. Each copy is rendered twice on that exact path with identical numeric offsets: muted gray in the input clip, and ivory in the output clip over a 34px black path stroke. The repeated-copy pitch is measured with an unpathed, off-canvas SVG probe because WebKit reports only the visible text-on-path portion; measuring the live textPath causes overlaps. The pill masks the clip boundary, so the same words visibly enter and leave it without appearing, fading, or changing order independently.
- The processing pill is warm, outlined `#111113`, and lightly frosted. Its ten dark waveform bars and restrained 1.2% pulse are deterministic functions of the same transport position that moves the sentence—not an unrelated CSS loop.
- An original flat editorial upper-body avatar sits directly above the pill. It is shown in right-facing profile with heavy ink-like outlines and a pine/lavender/coral palette. Only its mouth cavity, tongue, and lower lip move during the speaking loop; its head, eye, hair, neck, and torso remain still.
- Stage visuals remain `aria-hidden` and non-interactive because the title already states the product outcome. The animated sentence/ribbon is demonstration, not explanatory body copy.
- At 390px the hero fills the first viewport below the two-row nav (`min-height: calc(100svh - 107px)`), keeping the next section below the fold. The motion stage is anchored toward the bottom of that space; the connected composition remains horizontal, the curve rises less, the ribbon narrows to 28px, and each side shows a shorter contiguous sentence segment without causing page overflow.

## Navbar geometry

- Desktop: one centered pill, maximum 1200px, minimum 44px controls, 999px radius.
- Mobile: the same material becomes a two-row rounded capsule; no links or CTA are removed.
- Brand, navigation links, and CTA remain semantic HTML.
- Focus rings must follow each control’s pill geometry.

## Evidence, comparison, and sharing

- The pine proof card uses only workplaces explicitly supplied by the product owner: NVIDIA, Google, Apple, and Notion. The moving logo row must say it represents individual professionals and must explicitly state that the companies do not endorse or partner with WhisprTyper.
- The 45/220 WPM card remains an illustrative human-input comparison, not measured WhisprTyper throughput. A shared SVG word path crosses both cards; words move at the slower keyboard rate on the 45 WPM side and accelerate after entering the 220 WPM side. Reduced motion shows the complete path as a static relationship.
- The native menu-bar mock uses the same compact nine-bar waveform mark as the hero pill.
- Canonical, Open Graph, Twitter, and JSON-LD URLs use `https://whispr.bite.technology/`. Link previews use a dedicated inspected 1200×630 image, not the square app icon, and Twitter uses `summary_large_image`.

## Fallbacks

- `prefers-reduced-transparency`: use opaque warm surfaces and remove backdrop filtering; the hero pill becomes solid `#FFFEF5` while the output ribbon stays black.
- `forced-colors`: use system Canvas/CanvasText; the output ribbon becomes CanvasText and its moving words become Canvas for guaranteed inversion.
- `prefers-reduced-motion`: the same shared-path diagram remains visible with paired input/output sentence segments and a static waveform; no transport or pulse runs.
- A persistent 44px motion control pauses and resumes every automatic hero, company, app, and speed animation for users who do not request reduced motion.
- No JavaScript: authored offsets show the same static through-pill diagram directly from markup.
- Print: make the header static and opaque.

## Visual restraint

No rainbow rim, neon glow, cursor-following lens, distortion shader, or unrelated scroll animation. The material depth comes from fill, blur, edge, inner light, and shadow—not blur alone.
