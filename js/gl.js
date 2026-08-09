/* ==========================================================================
   WebGL engine — fullscreen-triangle shader passes on one shared rAF loop.
   Shaders are authored in GLSL ES 1.00, which a WebGL2 context also accepts,
   so one shader body serves both the WebGL2 and WebGL1 paths.
   ========================================================================== */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

/* Sampled from css/tokens.css, converted once here. Never decoded at runtime. */
export const PALETTE = {
  void:    [0.051, 0.047, 0.043], // --c-void      #0D0C0B
  surface: [0.102, 0.090, 0.078], // --c-surface   #1A1714
  line:    [0.227, 0.204, 0.165], // --c-line      #3A342A
  accent:  [1.000, 0.420, 0.102], // --c-accent    #FF6B1A
  text:    [0.949, 0.941, 0.929], // --c-text      #F2F0ED
};

export const ANGLE_RAD = (24 * Math.PI) / 180; // --angle

export function shouldRenderGL() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return false;
  if (matchMedia('(pointer: coarse)').matches && innerWidth < 768) return false;
  const probe = document.createElement('canvas');
  return !!(probe.getContext('webgl2') || probe.getContext('webgl'));
}

const state = {
  t: 0,
  scroll: 0,
  scrollTarget: 0,
  pointer: [0, 0],
  pointerTarget: [0, 0],
};

const passes = [];
let rafId = null;
let running = false;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('shader compile failed:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function link(gl, fragSrc) {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('program link failed:', gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

class Pass {
  constructor(canvas, fragSrc, opts = {}) {
    this.canvas = canvas;
    this.fragSrc = fragSrc;
    this.opts = opts;
    this.visible = false;
    this.ready = false;
    this.rect = { w: 1, h: 1 };
    this.build();
  }

  build() {
    const gl =
      this.canvas.getContext('webgl2', CTX_ATTRS) ||
      this.canvas.getContext('webgl', CTX_ATTRS);
    if (!gl) return;
    this.gl = gl;

    const prog = link(gl, this.fragSrc);
    if (!prog) return;
    this.prog = prog;

    this.buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    // One oversized triangle: fewer vertices than a quad, no diagonal seam.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations are resolved once, never inside the render loop.
    this.u = {};
    for (const name of ['u_time', 'u_resolution', 'u_pointer', 'u_scroll', 'u_angle',
                        'u_void', 'u_surface', 'u_line', 'u_accent', 'u_text']) {
      this.u[name] = gl.getUniformLocation(prog, name);
    }

    gl.useProgram(prog);
    gl.uniform1f(this.u.u_angle, ANGLE_RAD);
    gl.uniform3fv(this.u.u_void, PALETTE.void);
    gl.uniform3fv(this.u.u_surface, PALETTE.surface);
    gl.uniform3fv(this.u.u_line, PALETTE.line);
    gl.uniform3fv(this.u.u_accent, PALETTE.accent);
    gl.uniform3fv(this.u.u_text, PALETTE.text);

    this.resize();
    this.ready = true;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(r.width * dpr);
    const h = Math.round(r.height * dpr);
    if (w === this.rect.w && h === this.rect.h) return;
    this.rect = { w, h };
    this.canvas.width = w;
    this.canvas.height = h;
    if (this.gl) this.gl.viewport(0, 0, w, h);
  }

  render() {
    const { gl } = this;
    if (!gl || !this.ready) return;
    gl.useProgram(this.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.uniform1f(this.u.u_time, state.t);
    gl.uniform2f(this.u.u_resolution, this.rect.w, this.rect.h);
    gl.uniform2f(this.u.u_pointer, state.pointer[0], state.pointer[1]);
    gl.uniform1f(this.u.u_scroll, this.localScroll());
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* 0 when the pass sits at the bottom of the viewport, 1 when it has left the top. */
  localScroll() {
    const r = this.cached || { top: 0, height: 1 };
    return Math.min(Math.max((innerHeight - r.top) / (innerHeight + r.height), 0), 1);
  }

  measure() {
    const r = this.canvas.getBoundingClientRect();
    this.cached = { top: r.top, height: r.height };
  }

  destroy() {
    this.ready = false;
    const ext = this.gl && this.gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
  }
}

const CTX_ATTRS = {
  alpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  powerPreference: 'low-power',
  preserveDrawingBuffer: false,
};

function frame(now) {
  state.t = now * 0.001;

  // A single lerp per frame is what makes shader motion feel weighted.
  state.scroll += (state.scrollTarget - state.scroll) * 0.08;
  state.pointer[0] += (state.pointerTarget[0] - state.pointer[0]) * 0.06;
  state.pointer[1] += (state.pointerTarget[1] - state.pointer[1]) * 0.06;

  for (const p of passes) {
    if (p.visible && p.ready) p.render();
  }
  rafId = requestAnimationFrame(frame);
}

function start() {
  if (running) return;
  running = true;
  rafId = requestAnimationFrame(frame);
}

function stop() {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

let io = null;
let wired = false;

function wireGlobals() {
  if (wired) return;
  wired = true;

  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const pass = passes.find((p) => p.canvas === e.target);
        if (pass) pass.visible = e.isIntersecting;
      }
      const any = passes.some((p) => p.visible);
      if (any && !document.hidden) start();
      else stop();
    },
    { rootMargin: '120px' }
  );

  addEventListener('pointermove', (e) => {
    state.pointerTarget[0] = (e.clientX / innerWidth) * 2 - 1;
    state.pointerTarget[1] = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    state.scrollTarget = max > 0 ? scrollY / max : 0;
    for (const p of passes) p.measure();
  }, { passive: true });

  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      for (const p of passes) { p.resize(); p.measure(); }
    }, 150);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (passes.some((p) => p.visible)) start();
  });
}

export function addPass(canvas, fragSrc, opts) {
  wireGlobals();
  const pass = new Pass(canvas, fragSrc, opts);
  if (!pass.ready) return null;

  passes.push(pass);
  pass.measure();
  io.observe(canvas);

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault(); // Without this the context never comes back.
    pass.ready = false;
    if (!passes.some((p) => p.ready)) stop();
  });

  canvas.addEventListener('webglcontextrestored', () => {
    pass.build();
    pass.measure();
    if (pass.visible) start();
  });

  // Fade the canvas in only once a first frame has actually rendered.
  requestAnimationFrame(() => {
    pass.visible = true;
    pass.render();
    canvas.dataset.ready = 'true';
    start();
  });

  return pass;
}
