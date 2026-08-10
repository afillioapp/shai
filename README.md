# Shai Construction — website

Static, WebGL-driven marketing site for a general contractor in Richmond Hill, Ontario.
No build step, no bundler, no framework, no CDN. Every asset is local; the site works offline.

## Run it locally

```bash
python3 -m http.server 8777
# → http://localhost:8777
```

## Deploy

Upload the whole folder as-is to any static host — Netlify, Vercel, Cloudflare Pages, GitHub
Pages, or plain cPanel/FTP. There is nothing to compile.

**Before it goes live, do these:**

1. **Confirm the domain.** Every canonical URL, `og:url`, and JSON-LD `@id` currently assumes
   `https://www.shaiconstruction.ca/` (inferred from the business email). If the real domain
   differs, find and replace it across all four `.html` files, `sitemap.xml`, and `robots.txt`.
2. **Add business hours** on `contact.html` (there's a visible note marking the spot) and mirror
   them into the JSON-LD as `openingHoursSpecification`.
3. **Swap the two stock photos** for real Shai Construction work — see `CREDITS.md`.
4. **Add `og:image` files** (1200×630) and reference them in each page's head.
5. Optionally add `geo` coordinates and `priceRange` to the JSON-LD. Both were deliberately
   left out rather than guessed.

## Structure

```
index.html services.html about.html contact.html
css/
  tokens.css      every color, type, space, motion value — the single source of truth
  fonts.css       @font-face for the self-hosted woff2 files
  base.css        reset, type ladder, layout primitives, scroll-reveal
  components.css  nav, drawer, buttons, cards, forms, footer
  sections.css    hero, page layouts, graphic panels, CSS fallbacks for the shaders
js/
  gl.js           WebGL engine — context, passes, one shared rAF loop
  shaders.js      the three GLSL fragment shaders
  site.js         nav, drawer, reveals, contact form, shader mounting
fonts/  img/  Assets/
```

## Design system

Read `.claude/skills/shai-brand/SKILL.md` before changing anything visual.

The short version: **one angle (24°), used everywhere.** Square corners, no drop shadows, no
pure black or pure white. Warm near-black ground, warm off-white text, and a single amber
accent that always means "act here" — if amber covers more than ~5% of a viewport, it has
stopped meaning anything.

**Never hardcode a color, size, or spacing value.** Everything comes from a token in
`css/tokens.css`. Adding a hex value anywhere else is a bug.

## The WebGL layer

Three hand-written GLSL effects, no 3D library:

| Effect | Where | What it does |
|---|---|---|
| `shaft` | homepage hero | a column of warm light falling at the brand angle, carrying dust |
| `sheen` | about page, "How we work" | a slow specular sweep across brushed steel |
| `drift` | CTA bands | barely-there dust motes; deliberately inert to input |

Mount one by adding `<canvas class="fx" data-fx="shaft" aria-hidden="true"></canvas>` as the
first child of a `position: relative` section.

**The canvas is always an enhancement, never a dependency.** Each section is fully composed in
CSS first, and the canvas fades in on top only after a first frame renders successfully. It is
skipped entirely on `prefers-reduced-motion: reduce`, on machines with ≤4 cores, on small
touch screens, and when WebGL is unavailable. Test that path by enabling "reduce motion" in
your OS — the hero should still look like a finished composition.

See `.claude/skills/webgl-site/SKILL.md` for the engine rules (one rAF loop, no allocations or
layout reads inside it, DPR capped at 2, context-loss recovery).

## Photography

Two placeholder photographs are in place: the homepage hero (timber roof framing) and the
"Nine services" section (a finished kitchen). Both are CC BY 2.0 stock, cropped and graded to
the palette — **see `CREDITS.md`, which explains the attribution obligation and how to swap
them for real Shai Construction photos.** Replacing them is the single highest-value change
you can make to this site.

The hero's legibility comes from the CSS overlay in `.hero__media::after`, not from the photo,
so a brighter replacement image cannot break the text contrast. Hero copy runs at full
`--c-text` contrast for the same reason — dim and amber text cannot hold 4.5:1 against every
frame of a photograph. All three hero text blocks currently measure 7.6:1 or better at 360,
768, and 1440.

Every remaining place a photograph belongs is marked two ways:

- a `.plate` panel, labelled with its aspect ratio on screen
- an HTML comment directly above it giving the suggested `alt` text

Filled slots use `.shot` instead — same angle-cut geometry and corner tick, so a photo and an
empty slot read as the same family. `.shot--light` is the gentler overlay used on the services
page, where the photographs should stay bright.

To drop in a real photo, replace the `.plate` div with:

```html
<img src="img/your-photo.jpg" alt="Describe the work shown" width="1600" height="1200" loading="lazy" decoding="async">
```

Keep the `width`/`height` attributes — they are what stop the page from shifting as images load.
Shoot or crop to the ratio the slot is labelled with.

## The contact form

There is no backend on a static host, so the form validates inline and then hands off to the
visitor's own mail client with the message pre-composed to `info@shaiconstruction.ca`.

If you want submissions to arrive without the visitor's mail app opening, point the form at a
static-form service (Formspree, Netlify Forms, Basin) by adding an `action` and `method` to the
`<form>` and removing the `location.href` line in `js/site.js`.

## Business facts — keep these byte-identical everywhere

```
Shai Construction
58 Kings Cross Ave, Richmond Hill, ON L4B 2S8
416-522-4547     (link as tel:+14165224547)
info@shaiconstruction.ca
Providing construction services since 2017
```

The name/address/phone appears in the footer of all four pages, on the contact page, and in the
JSON-LD. If those copies drift apart, local search ranking suffers — treat any mismatch as a bug.

**No testimonials, ratings, review counts, awards, licence numbers, staff names, or project
counts appear anywhere on this site**, because none were verified. Don't add them as filler —
for a real contractor, fabricated trust signals are both a legal and a reputational liability.
When you have real ones, add them and update the JSON-LD to match.

## Team agents

`.claude/agents/` defines four project agents — `tech-lead`, `design`, `development`,
`content-manager`. Invoke one with e.g. "use the design agent to review the services page".
`.claude/skills/` holds the brand system, the WebGL patterns, and the local-SEO checklist that
those agents (and you) work from.
