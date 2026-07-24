# WhisprTyper Motion Brief

## Purpose

- Product: WhisprTyper marketing website
- Audience: Mac users seeking fast, private voice typing
- Message: the navbar is persistent, calm, and premium without distracting from the product demo
- Primary CTA: Get the app
- Canonical source: semantic HTML navigation in `index.html`

## Story

The navbar remains a stable floating Liquid Glass capsule while the page moves beneath it. Only direct hover, focus, and press interactions change control surfaces; scrolling does not trigger decorative choreography.

## Timeline

| Scene | Range | State | Render mode | Acceptance criterion |
|---|---:|---|---|---|
| Persistent glass | 0.00–1.00 | Floating frosted capsule | CSS | Geometry and contrast remain stable at every scroll position |

## Render decision

- CSS only for translucency, edge light, hover/focus, and responsive layout.
- No frame sequence, WebGL, or generated media.
- The no-motion choice preserves hierarchy and keeps the real voice-pilling demo as the page’s only product interaction.

## Desktop

- Sticky offset: 10px.
- One-row pill with all controls at least 44px tall.
- No scroll-linked transform or opacity changes.

## Mobile

- Same material and content in a two-row rounded capsule.
- Horizontal link row may scroll within the capsule if necessary.
- No horizontal page overflow at 390px.

## Accessibility and fallbacks

- Reduced motion: identical static state; no motion is required.
- Reduced transparency: opaque warm surface, no blur.
- No JavaScript: navbar remains complete and sticky.
- Keyboard: semantic links and visible pill-shaped focus rings.
- Forced colors: system colors and solid border.

## Verification

- [ ] Desktop and 390px mobile have no overflow
- [ ] Every nav control is at least 44px high
- [ ] Contrast remains readable over hero and scrolled content
- [ ] Reduced-transparency and forced-colors fallbacks exist
- [ ] Browser console remains clean
