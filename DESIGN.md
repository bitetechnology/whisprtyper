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
- **Strong:** dense copy and transactional content remain opaque or strongly frosted.
- **Subtle:** decorative badges and compact overlays only.
- The full viewport header must remain transparent; the glass boundary belongs to the capsule itself.

## Navbar geometry

- Desktop: one centered pill, maximum 1200px, minimum 44px controls, 999px radius.
- Mobile: the same material becomes a two-row rounded capsule; no links or CTA are removed.
- Brand, navigation links, and CTA remain semantic HTML.
- Focus rings must follow each control’s pill geometry.

## Fallbacks

- `prefers-reduced-transparency`: use an opaque warm surface and remove backdrop filtering.
- `forced-colors`: use system Canvas/CanvasText and a visible solid border.
- Print: make the header static and opaque.

## Visual restraint

No rainbow rim, neon glow, cursor-following lens, distortion shader, or unrelated scroll animation. The material depth comes from fill, blur, edge, inner light, and shadow—not blur alone.
