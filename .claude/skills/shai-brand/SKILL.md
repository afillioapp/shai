---
name: shai-brand
description: The Shai Construction brand and design system — logo logic, the signature angle, color tokens, type scale, spacing rhythm, motion easing, and component conventions. Use before writing any CSS or markup for this site, and when reviewing whether a built page is on-brand.
---

# Shai Construction — brand system

General contractor, Richmond Hill Ontario, building since 2017. Residential and commercial.

## The mark

A single "S" cut from two interlocking chevrons meeting at a sharp center vertex. Straight edges, mitred joins, no curves in the structure. Read it as **steel plate, cut and folded**. Files: `Assets/shai-mark.png` (near-black on transparent), `Assets/shai-mark-light.png` (off-white on transparent).

Everything visual derives from that: **angles, mass, and void.**

## The signature angle

`--angle: 24deg` — one slope, used everywhere. Section dividers, image masks, hover reveals, and the underline on active nav all cut on it. Reuse builds identity; variety destroys it. Never mix in a second angle.

Implement as `clip-path: polygon(...)` on section wrappers, not as rotated pseudo-elements, so nothing overflows or creates scroll.

## Color tokens

Defined once in `css/tokens.css` as custom properties. **No hex value appears anywhere else in the codebase.**

Dark is the primary surface (this site is dark-first — it suits steel and light-shaft imagery):

| Token | Role |
|---|---|
| `--c-void` | deepest ground, warm near-black `#0D0C0B` — never pure `#000` |
| `--c-surface` | primary section ground, graphite |
| `--c-surface-2` | raised cards, one step up |
| `--c-line` | hairline rules and borders, low-contrast graphite |
| `--c-text` | primary text, warm off-white `#F2F0ED` — never pure `#fff` |
| `--c-text-dim` | secondary text, must still hit 4.5:1 on `--c-surface` |
| `--c-accent` | safety amber `#FF6B1A` — the single hot accent |
| `--c-accent-ink` | text color that sits legibly *on* the accent (near-black) |
| `--c-concrete` | warm off-white for inverted/light sections |

**Accent discipline:** amber means "act here" — primary CTAs, the active nav marker, focus rings, one key rule per section. If more than ~5% of a viewport is amber, it has stopped meaning anything. Never set body text in amber.

Light-mode / inverted sections redefine the same token names; components never branch on theme.

## Typography

- **Display:** a condensed high-contrast grotesk. Headlines uppercase, tracking tightened (`-0.02em`), line-height `0.95–1.05`. Big, heavy, cropped tight.
- **Body:** a neutral humanist sans, `1.6` line-height, measure capped at `68ch`.
- Self-hosted `.woff2` in `fonts/` with `font-display: swap`, or a system stack. **Never a font CDN.**

Fixed ratio ladder, no arbitrary sizes:

```css
--t-xs:   clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem);
--t-sm:   clamp(0.875rem, 0.84rem + 0.2vw, 0.9375rem);
--t-base: clamp(1rem, 0.96rem + 0.25vw, 1.0625rem);
--t-lg:   clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem);
--t-xl:   clamp(1.75rem, 1.4rem + 1.4vw, 2.5rem);
--t-2xl:  clamp(2.5rem, 1.8rem + 3vw, 4.5rem);
--t-3xl:  clamp(3.5rem, 2rem + 6.5vw, 8rem);
```

`--t-3xl` is for the hero H1 only. Section headers are `--t-2xl`.

## Space

An 8px rhythm on a geometric ladder: `--s-1: 0.5rem` through `--s-10: 10rem`. Section vertical padding is `--s-8` mobile, `--s-10` desktop. Nothing gets a hand-typed margin.

Layout: `--container: 1280px`, gutters `--s-3` mobile / `--s-6` desktop. A 12-column grid on desktop; asymmetric splits (7/5, 8/4) beat centered 6/6 — symmetry reads generic.

## Motion

```css
--ease: cubic-bezier(0.16, 1, 0.3, 1);  /* decelerate hard, no overshoot */
--dur-fast: 180ms;
--dur: 420ms;
--dur-slow: 900ms;
```

Things **assemble**: reveals slide along `--angle` and settle. Nothing bounces, nothing loops behind text, nothing autoplays with sound. Stagger children by 60ms, capped at 6 steps.

Every motion rule needs a `@media (prefers-reduced-motion: reduce)` counterpart that lands on the final composed frame. The static frame must look intentional, not like a broken animation.

## Components

- **Buttons:** square corners (`--radius: 0`) — this brand does not do rounded. Primary is amber on near-black ink; secondary is a hairline outline. Min touch target 44px.
- **Cards:** hairline `--c-line` border, no drop shadows (shadows read soft; this brand is cut steel). Hover lifts contrast and reveals an amber rule on the brand angle.
- **Focus:** `outline: 2px solid var(--c-accent); outline-offset: 3px` — always visible, never removed.
- **Images:** masked on the brand angle where it strengthens the composition, otherwise square. Always with explicit `width`/`height`.

## Photography direction

Real trade work in real light: framing lumber, poured concrete, a finished kitchen at dusk, an excavator at grade. Warm dust-in-light over clean product shots. Cool contractor stock with people in hard hats pointing at blueprints is banned. Grade everything slightly warm and contrasty so it sits with the palette.

## On-brand check

- [ ] One angle, used repeatedly
- [ ] Amber under ~5% of any viewport, always meaning "act"
- [ ] No pure black, no pure white, no rounded corners, no soft shadows
- [ ] Type from the ladder only; headlines tight and heavy
- [ ] Body text ≥ 4.5:1, large text and UI ≥ 3:1
- [ ] Reduced-motion frame looks composed
