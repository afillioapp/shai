---
name: webgl-site
description: Patterns for raw WebGL2/GLSL effects on a static marketing site — context setup with WebGL1 fallback, fullscreen-quad shader passes, a single shared rAF loop, scroll/pointer uniforms, context-loss recovery, and the mandatory no-WebGL/reduced-motion fallback path. Use whenever writing, debugging, or reviewing canvas, shader, or scroll-motion code on this site.
---

# WebGL on a static site

Raw WebGL2 with hand-written GLSL. No three.js — everything here is fullscreen-quad shader work plus one textured-plane pass, which a library would only make heavier.

## The one rule that outranks the rest

**The fallback ships first.** Build and style the section so it looks finished with no canvas at all. Then append the canvas as a decorative layer (`aria-hidden="true"`, `pointer-events:none`) that fades in only after a successful context + first frame. If anything fails, nothing visibly breaks.

Bail out to the fallback when any of these are true:

```js
export function shouldRenderGL() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return false;
  if (matchMedia('(pointer: coarse)').matches && innerWidth < 768) return false;
  const c = document.createElement('canvas');
  return !!(c.getContext('webgl2') || c.getContext('webgl'));
}
```

## Context setup

```js
const gl = canvas.getContext('webgl2', {
  alpha: true, antialias: false, depth: false, stencil: false,
  powerPreference: 'low-power', preserveDrawingBuffer: false,
});
```

`antialias:false` and no depth/stencil buffers, because fullscreen quads never need them. `low-power` keeps laptops off the discrete GPU for a background effect.

WebGL1 fallback: same code path, but shaders must be authored so the `#version 300 es` header, `in/out`, and `texture()` can be swapped for `attribute/varying` and `texture2D()`. Keep one preamble string per version and concatenate — do not maintain two copies of the shader body.

## Fullscreen quad

Two triangles in clip space, one static buffer, no index buffer, no per-frame allocation:

```js
const quad = new Float32Array([-1,-1, 3,-1, -1,3]);
```

A single oversized triangle beats a two-triangle quad — one less vertex, no diagonal seam.

## One loop for the whole page

```js
const state = { t: 0, scroll: 0, scrollVel: 0, px: 0, py: 0, dpr: 1 };
const passes = [];
function frame(now) {
  state.t = now * 0.001;
  for (const p of passes) if (p.visible) p.render(state);
  raf = requestAnimationFrame(frame);
}
```

Never one `requestAnimationFrame` per component. Pointer and scroll handlers write into `state` only — they never render and never read layout. Cache `getBoundingClientRect()` per pass and refresh on resize and scroll-end, never inside `frame`.

Pause aggressively:

```js
new IntersectionObserver(es => es.forEach(e => { pass.visible = e.isIntersecting; }),
  { rootMargin: '100px' }).observe(pass.canvas);
document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
```

## Resize

Debounce, cap DPR at 2, and set both the drawing-buffer size and the CSS size:

```js
const dpr = Math.min(devicePixelRatio || 1, 2);
canvas.width  = Math.round(rect.width  * dpr);
canvas.height = Math.round(rect.height * dpr);
gl.viewport(0, 0, canvas.width, canvas.height);
```

Pass `u_resolution` as the drawing-buffer size and correct aspect in the shader with `uv.x *= res.x/res.y` — never assume a square.

## Context loss

```js
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); stop(); });
canvas.addEventListener('webglcontextrestored', () => { build(); start(); });
```

Without `preventDefault()` the context never comes back. This fires in the real world on GPU driver resets and tab backgrounding — it is not a theoretical case.

## Shader craft

- Uniform names prefixed `u_`, varyings `v_`. Declare `precision highp float;` and fall back to `mediump` if `getShaderPrecisionFormat` reports no highp.
- Always check `getShaderParameter(s, COMPILE_STATUS)` and log `getShaderInfoLog` in dev — a silent black canvas is the default failure mode otherwise.
- Cache uniform locations once at build time in a map. `getUniformLocation` in the render loop is a real cost.
- Prefer cheap value/simplex noise and `smoothstep` bands over loops. Any `for` loop in a fragment shader is paying per pixel — keep iterations under 8 and constant-bounded.
- Time-based motion multiplies `u_time` by small factors (0.05–0.3). Background motion that reads as "fast" is always wrong behind text.

## Scroll-linked motion

Drive uniforms from a smoothed scroll value, not the raw one:

```js
state.scroll += (target - state.scroll) * 0.08;
```

That single lerp is what makes shader motion feel weighted instead of jittery. Same for pointer position.

## Textured passes (image displacement)

Images used as textures need `crossOrigin` unset (same-origin only), `UNPACK_FLIP_Y_WEBGL` set true, `CLAMP_TO_EDGE` on both axes, and `LINEAR` filtering with no mipmaps for non-power-of-two sources. Upload once on `decode()`, never per frame.

## Review checklist

- [ ] Section is complete and styled with the canvas removed entirely
- [ ] `prefers-reduced-motion: reduce` renders a designed static frame
- [ ] One rAF loop; zero allocations inside it; no layout reads inside it
- [ ] Paused when offscreen and when `document.hidden`
- [ ] DPR capped, resize debounced, viewport updated
- [ ] Context loss handled with `preventDefault`
- [ ] Canvas is `aria-hidden`, `pointer-events:none`, and never carries content
- [ ] No console errors; shader compile/link logs checked
