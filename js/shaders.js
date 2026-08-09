/* ==========================================================================
   GLSL ES 1.00 fragment shaders. Three effects, no more.
   Time multipliers stay in the 0.01–0.08 range — nothing behind text may
   read as "fast".
   ========================================================================== */

const COMMON = `
precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform vec2  u_pointer;
uniform float u_scroll;
uniform float u_angle;
uniform vec3  u_void;
uniform vec3  u_surface;
uniform vec3  u_line;
uniform vec3  u_accent;
uniform vec3  u_text;

vec2 rot(vec2 p, float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c) * p;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm2(vec2 p) {
  return vnoise(p) * 0.65 + vnoise(p * 2.03) * 0.35;
}

vec3 screenBlend(vec3 a, vec3 b) { return 1.0 - (1.0 - a) * (1.0 - b); }
`;

/* --------------------------------------------------------------------------
   1. SHAFT — the hero. A wide column of warm light falls across dark steel
   ground at the brand angle, carrying suspended dust. The amber is only the
   thin hot seam at the shaft's core, which keeps it inside the accent budget
   even though the effect fills the viewport.
   -------------------------------------------------------------------------- */
export const SHAFT = COMMON + `
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  vec2 ruv = rot(uv, u_angle);

  // The shaft: a soft-edged band whose centerline drifts, nudged by pointer.
  float center = sin(u_time * 0.03) * 0.10 + u_pointer.x * 0.05;
  float d = abs(ruv.x - center);
  float width = 0.30 + sin(u_time * 0.021) * 0.018;

  float band = smoothstep(width, 0.0, d);
  band *= mix(1.0, 0.22, smoothstep(0.0, 0.75, u_scroll)); // dims as you scroll past

  // Additive light only — no ground is drawn, so the photograph beneath stays
  // visible and this layer reads as light falling across it.
  float core = smoothstep(width * 0.16, 0.0, d);
  vec3 light = mix(u_text * 0.42, u_accent, core * 0.62);

  // Dust: sparse specks drifting along the shaft's own axis, slower than the
  // shaft itself so they read as suspended particulate.
  float dust = fbm2(ruv * 7.0 + vec2(u_time * 0.006, u_time * 0.015));
  dust = smoothstep(0.58, 0.78, dust) * band;

  float a = band * 0.30 + dust * 0.14;
  a *= smoothstep(1.35, 0.35, length(uv)); // falls off at the corners

  // Premultiplied: the canvas composites over the photo without darkening it.
  gl_FragColor = vec4(light * a + u_text * dust * 0.10, a);
}
`;

/* --------------------------------------------------------------------------
   2. SHEEN — mid-page. A slow specular sweep crossing a brushed-steel panel,
   like raking light passing over cut metal once every ~14 seconds. Carries
   zero amber, so the section's accent budget stays with its CTA.
   -------------------------------------------------------------------------- */
export const SHEEN = COMMON + `
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  vec2 ruv = rot(uv, u_angle);

  // Brushed metal: noise stretched hard along one axis.
  float brush = vnoise(vec2(ruv.x * 220.0, ruv.y * 3.0));
  vec3 col = mix(u_surface, u_line, brush * 0.35);

  // The sweep loops seamlessly across the diagonal extent.
  float travel = fract(u_time * 0.045);
  float pos = mix(-1.2, 1.2, travel);
  float s = 1.0 - abs(ruv.x - pos) / 0.34;
  float sheen = pow(max(s, 0.0), 3.0);

  // Fade out once the section is mostly scrolled past — never run invisibly.
  sheen *= 1.0 - smoothstep(0.55, 0.95, u_scroll);

  col = screenBlend(col, u_text * sheen * 0.16);

  float grain = hash(gl_FragCoord.xy * 0.7);
  col += (grain - 0.5) * 0.016;

  gl_FragColor = vec4(col, 1.0);
}
`;

/* --------------------------------------------------------------------------
   3. DRIFT — ambient connective tissue between sections. Barely-there dust
   motes rising slowly. Deliberately inert to pointer and scroll: it is
   environment, not a UI response. If a viewer consciously notices it
   animating, it is tuned too hot.
   -------------------------------------------------------------------------- */
export const DRIFT = COMMON + `
void main() {
  // Scaled in device pixels, not viewport fractions, so mote size stays
  // constant whatever shape the section is.
  vec2 uv = gl_FragCoord.xy / 90.0;

  float n = vnoise(uv - vec2(0.0, u_time * 0.05));
  float motes = smoothstep(0.80, 0.97, n);

  float n2 = vnoise(uv * 2.1 - vec2(0.0, u_time * 0.09) + 41.0);
  motes += smoothstep(0.86, 0.99, n2) * 0.5;

  float a = motes * 0.05;
  gl_FragColor = vec4(u_line * a, a);
}
`;
