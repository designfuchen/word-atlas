import type { GalaxyLayout } from "./layout";

/** 0 unseen dust · 1 learning · 2 mastered · 3 highlighted (today / this session). */
export type StarState = 0 | 1 | 2 | 3;

export interface Camera {
  yaw: number;
  pitch: number;
  dist: number;
  tx: number;
  ty: number;
  tz: number;
}

/* ---------- tiny matrix helpers (column-major, like WebGL) ---------- */

function perspective(fovy: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

function lookAt(ex: number, ey: number, ez: number, cx: number, cy: number, cz: number) {
  let zx = ex - cx;
  let zy = ey - cy;
  let zz = ez - cz;
  let l = Math.hypot(zx, zy, zz) || 1;
  zx /= l;
  zy /= l;
  zz /= l;
  // up = (0,1,0)
  let xx = zz;
  let xy = 0;
  let xz = -zx;
  l = Math.hypot(xx, xy, xz) || 1;
  xx /= l;
  xy /= l;
  xz /= l;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * ex + xy * ey + xz * ez), -(yx * ex + yy * ey + yz * ez), -(zx * ex + zy * ey + zz * ez), 1,
  ]);
}

function multiply(a: Float32Array, b: Float32Array) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
  return o;
}

/* ---------- shaders ---------- */

const STAR_VS = `#version 300 es
in vec3 aPos; in vec3 aColor; in float aSeed; in float aState;
uniform mat4 uVP; uniform float uTime, uIntro, uScale, uHover, uMotion;
out vec3 vColor; out float vAlpha; out float vGold;
void main(){
  float t = clamp((uIntro - aSeed * 0.4) / 0.6, 0.0, 1.0);
  float e = 1.0 - pow(1.0 - t, 3.0);
  // Stars spiral in from a wide, loose ring into the galaxy.
  float ang = atan(aPos.z, aPos.x) + (1.0 - e) * 3.4;
  float rad = length(aPos.xz) * mix(2.4, 1.0, e);
  vec3 p = vec3(cos(ang) * rad, aPos.y * e, sin(ang) * rad);
  // Learned stars breathe very slightly above the disc.
  p.y += uMotion * step(0.5, aState) * sin(uTime * 0.6 + aSeed * 30.0) * 0.004;
  vec4 clip = uVP * vec4(p, 1.0);
  gl_Position = clip;
  float tw = mix(1.0, 0.7 + 0.3 * sin(uTime * (1.0 + aSeed * 2.5) + aSeed * 50.0), uMotion);
  // Unlearned words are coloured stardust; learning brightens them, mastery makes them blaze.
  float size = 3.4 + aSeed * 1.6; float alpha = 0.78; vec3 col = mix(aColor, vec3(0.8, 0.84, 1.0), 0.28);
  if (aState > 0.5) { size = 7.5; alpha = 1.0; col = mix(aColor, vec3(1.0, 0.85, 0.5), 0.35); }
  if (aState > 1.5) { size = 10.0; alpha = 1.0; col = mix(aColor, vec3(1.0, 0.97, 0.9), 0.6); }
  if (aState > 2.5) { size = 13.0; alpha = 1.0; col = vec3(1.0, 0.74, 0.34); }
  if (abs(float(gl_VertexID) - uHover) < 0.5) { size *= 2.4; alpha = 1.0; col = vec3(1.0); }
  gl_PointSize = max(1.2, size * uScale / clip.w) * (aState > 0.5 ? 1.0 : tw);
  vColor = col;
  vAlpha = alpha * e * (aState > 0.5 ? mix(1.0, tw, 0.35) : tw);
  vGold = step(2.5, aState);
  // Today's stars carry a wide halo, so they read even in a small view.
  gl_PointSize *= mix(1.0, 2.6, vGold);
}`;

const STAR_FS = `#version 300 es
precision mediump float;
in vec3 vColor; in float vAlpha; in float vGold;
out vec4 o;
void main(){
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float d = dot(c, c);
  if (d > 1.0) discard;
  float core = mix(9.0, 40.0, vGold);
  float a = (exp(-d * core) + exp(-d * mix(2.5, 3.5, vGold)) * mix(0.28, 0.55, vGold)) * vAlpha;
  o = vec4(vColor * a, a);
}`;

const NEBULA_VS = `#version 300 es
const vec2 P[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
out vec2 vUv;
void main(){ vUv = P[gl_VertexID] * 0.5 + 0.5; gl_Position = vec4(P[gl_VertexID], 0.0, 1.0); }`;

const NEBULA_FS = `#version 300 es
precision mediump float;
in vec2 vUv; out vec4 o;
uniform float uTime, uYaw, uAspect, uIntro;
uniform vec2 uCore;
uniform int uOct;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ if (i >= uOct) break; s += a * n(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }
void main(){
  vec2 uv = vUv; uv.x *= uAspect;
  vec2 q = uv * 2.2 + vec2(uYaw * 0.35, 0.0) + uTime * 0.008;
  float f = fbm(q + fbm(q * 1.7 + uTime * 0.01));
  vec3 base = vec3(0.035, 0.047, 0.098);
  vec3 c1 = vec3(0.23, 0.16, 0.42);   // plum
  vec3 c2 = vec3(0.08, 0.27, 0.36);   // teal
  vec3 c3 = vec3(0.55, 0.32, 0.18);   // ochre dust
  vec3 col = base + c1 * smoothstep(0.45, 0.95, f) * 0.55 + c2 * smoothstep(0.55, 1.0, fbm(q * 0.8 - 3.0)) * 0.45;
  vec2 cd = (vUv - uCore); cd.x *= uAspect;
  float core = exp(-dot(cd, cd) * 9.0);
  col += c3 * core * 0.55 + vec3(1.0, 0.85, 0.6) * exp(-dot(cd, cd) * 60.0) * 0.18;
  float vig = smoothstep(1.25, 0.25, length((vUv - 0.5) * vec2(uAspect, 1.0)));
  o = vec4(col * mix(0.55, 1.0, vig) * (0.35 + 0.65 * uIntro), 1.0);
}`;

function shader(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
  return s;
}
function program(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const p = gl.createProgram()!;
  gl.attachShader(p, shader(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, shader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
  return p;
}

export interface EngineOptions {
  quality: "high" | "low";
  reducedMotion: boolean;
  preserve?: boolean;
  autoRotate?: number;
  /** Multiplies the default viewing distance; smaller galaxies stand closer. */
  distScale?: number;
}

/** Choose a quality tier before the first frame. */
export function detectQuality(): "high" | "low" {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const small = Math.min(screen.width, screen.height) < 600;
  if ((nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4 || small) return "low";
  return "high";
}

export class GalaxyEngine {
  readonly cam: Camera = { yaw: 0.6, pitch: 1.12, dist: 1.8, tx: 0, ty: 0, tz: 0 };
  private goal: Partial<Camera> | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private ctx2d: CanvasRenderingContext2D | null = null;
  private star?: WebGLProgram;
  private neb?: WebGLProgram;
  private vao?: WebGLVertexArrayObject;
  private stateBuf?: WebGLBuffer;
  private states: Float32Array;
  private vp = new Float32Array(16);
  private screen: Float32Array;
  private raf = 0;
  private t0 = performance.now();
  private last = performance.now();
  private introStart = performance.now();
  private running = false;
  private w = 1;
  private h = 1;
  private dpr = 1;
  hover = -1;
  autoRotate: number;
  onFrame?: () => void;

  constructor(
    private canvas: HTMLCanvasElement,
    private layout: GalaxyLayout,
    private opts: EngineOptions,
  ) {
    this.states = new Float32Array(layout.n);
    this.screen = new Float32Array(layout.n * 3);
    this.autoRotate = opts.autoRotate ?? 0.035;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, premultipliedAlpha: true, preserveDrawingBuffer: !!opts.preserve, powerPreference: "high-performance" });
    if (gl) {
      try {
        this.initGL(gl);
        this.gl = gl;
      } catch {
        this.gl = null;
      }
    }
    if (!this.gl) this.ctx2d = canvas.getContext("2d");
    if (opts.reducedMotion) this.introStart = -1e9;
  }

  get webgl() {
    return !!this.gl;
  }

  private initGL(gl: WebGL2RenderingContext) {
    const L = this.layout;
    this.star = program(gl, STAR_VS, STAR_FS);
    this.neb = program(gl, NEBULA_VS, NEBULA_FS);
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    const attr = (name: string, data: Float32Array, size: number, usage: number = gl.STATIC_DRAW) => {
      const buf = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, usage);
      const loc = gl.getAttribLocation(this.star!, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      return buf;
    };
    attr("aPos", L.positions, 3);
    attr("aColor", L.colors, 3);
    attr("aSeed", L.seeds, 1);
    this.stateBuf = attr("aState", this.states, 1, gl.DYNAMIC_DRAW);
    gl.bindVertexArray(null);
  }

  setStates(states: Float32Array) {
    this.states.set(states);
    const gl = this.gl;
    if (gl && this.stateBuf) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.stateBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.states);
    }
  }

  setState(i: number, s: StarState) {
    this.states[i] = s;
    const gl = this.gl;
    if (gl && this.stateBuf) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.stateBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, i * 4, this.states.subarray(i, i + 1));
    }
  }

  /** Default viewing distance: portrait screens need to stand further back. */
  baseDist() {
    const aspect = this.w / this.h;
    const d = aspect < 1 ? (1.8 / Math.max(0.55, aspect)) * 0.82 : 1.8;
    return d * (this.opts.distScale ?? 1);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const first = this.w === 1;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.opts.quality === "low" ? 1.25 : 2);
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    if (first) this.cam.dist = this.baseDist();
  }

  /** Frame a set of stars immediately (no animation). */
  frameStars(indices: number[], dist = 1.15) {
    if (!indices.length) return;
    const p = this.layout.positions;
    let x = 0;
    let y = 0;
    let z = 0;
    indices.forEach((i) => {
      x += p[i * 3];
      y += p[i * 3 + 1];
      z += p[i * 3 + 2];
    });
    const n = indices.length;
    Object.assign(this.cam, { tx: (x / n) * 0.6, ty: y / n, tz: (z / n) * 0.6, dist });
  }

  /** Smoothly move the camera toward a word. */
  flyTo(i: number, dist = 0.75) {
    const p = this.layout.positions;
    this.goal = { tx: p[i * 3], ty: p[i * 3 + 1], tz: p[i * 3 + 2], dist };
  }

  reset() {
    this.goal = { tx: 0, ty: 0, tz: 0, dist: this.baseDist(), pitch: 1.12 };
  }

  replayIntro() {
    if (!this.opts.reducedMotion) this.introStart = performance.now();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      this.frame(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Stop drawing. The context stays alive: the same canvas may be mounted again (React StrictMode). */
  destroy() {
    this.stop();
    this.onFrame = undefined;
  }

  private matrices() {
    const c = this.cam;
    const ex = c.tx + c.dist * Math.cos(c.pitch) * Math.sin(c.yaw);
    const ey = c.ty + c.dist * Math.sin(c.pitch);
    const ez = c.tz + c.dist * Math.cos(c.pitch) * Math.cos(c.yaw);
    const proj = perspective(0.75, this.w / this.h, 0.02, 20);
    this.vp = multiply(proj, lookAt(ex, ey, ez, c.tx, c.ty, c.tz));
  }

  /** Project every star to CSS pixels (x, y, depth); depth <= 0 means behind the camera. */
  private project() {
    const m = this.vp;
    const p = this.layout.positions;
    const s = this.screen;
    for (let i = 0; i < this.layout.n; i++) {
      const x = p[i * 3];
      const y = p[i * 3 + 1];
      const z = p[i * 3 + 2];
      const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
      if (cw <= 0.01) {
        s[i * 3 + 2] = -1;
        continue;
      }
      const cx = (m[0] * x + m[4] * y + m[8] * z + m[12]) / cw;
      const cy = (m[1] * x + m[5] * y + m[9] * z + m[13]) / cw;
      s[i * 3] = (cx * 0.5 + 0.5) * this.w;
      s[i * 3 + 1] = (1 - (cy * 0.5 + 0.5)) * this.h;
      s[i * 3 + 2] = cw;
    }
  }

  /** CSS-pixel position of a world point, or null when behind the camera. */
  toScreen(x: number, y: number, z: number) {
    const m = this.vp;
    const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
    if (cw <= 0.01) return null;
    const cx = (m[0] * x + m[4] * y + m[8] * z + m[12]) / cw;
    const cy = (m[1] * x + m[5] * y + m[9] * z + m[13]) / cw;
    return { x: (cx * 0.5 + 0.5) * this.w, y: (1 - (cy * 0.5 + 0.5)) * this.h, depth: cw };
  }

  starScreen(i: number) {
    return { x: this.screen[i * 3], y: this.screen[i * 3 + 1], depth: this.screen[i * 3 + 2] };
  }

  /** Nearest star to a pointer, favouring lit stars; null if nothing is close. */
  pick(px: number, py: number, radius = 16) {
    this.project();
    let best = -1;
    let bestScore = Infinity;
    for (let i = 0; i < this.layout.n; i++) {
      const d = this.screen[i * 3 + 2];
      if (d <= 0) continue;
      const dx = this.screen[i * 3] - px;
      const dy = this.screen[i * 3 + 1] - py;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) continue;
      const score = dist - this.states[i] * 4;
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }
    return best;
  }

  private frame(now: number) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const t = (now - this.t0) / 1000;
    const intro = Math.min(1, (now - this.introStart) / 2600);
    if (!this.opts.reducedMotion) this.cam.yaw += this.autoRotate * dt;
    if (this.goal) {
      const g = this.goal as Record<string, number>;
      const c = this.cam as unknown as Record<string, number>;
      let done = true;
      for (const k of Object.keys(g)) {
        c[k] += (g[k] - c[k]) * Math.min(1, dt * 3.2);
        if (Math.abs(g[k] - c[k]) > 1e-3) done = false;
      }
      if (done) this.goal = null;
    }
    this.matrices();
    if (this.gl) this.drawGL(t, intro);
    else this.draw2D(t, intro);
    this.onFrame?.();
  }

  private drawGL(t: number, intro: number) {
    const gl = this.gl!;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.disable(gl.BLEND);
    gl.useProgram(this.neb!);
    const core = this.toScreen(0, 0, 0);
    gl.uniform1f(gl.getUniformLocation(this.neb!, "uTime"), this.opts.reducedMotion ? 0 : t);
    gl.uniform1f(gl.getUniformLocation(this.neb!, "uYaw"), this.cam.yaw);
    gl.uniform1f(gl.getUniformLocation(this.neb!, "uAspect"), this.w / this.h);
    gl.uniform1f(gl.getUniformLocation(this.neb!, "uIntro"), intro);
    gl.uniform2f(gl.getUniformLocation(this.neb!, "uCore"), core ? core.x / this.w : 0.5, core ? 1 - core.y / this.h : 0.5);
    gl.uniform1i(gl.getUniformLocation(this.neb!, "uOct"), this.opts.quality === "low" ? 3 : 5);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(this.star!);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.star!, "uVP"), false, this.vp);
    gl.uniform1f(gl.getUniformLocation(this.star!, "uTime"), t);
    gl.uniform1f(gl.getUniformLocation(this.star!, "uIntro"), intro);
    gl.uniform1f(gl.getUniformLocation(this.star!, "uScale"), this.dpr * Math.min(this.w, this.h) / 520);
    gl.uniform1f(gl.getUniformLocation(this.star!, "uHover"), this.hover);
    gl.uniform1f(gl.getUniformLocation(this.star!, "uMotion"), this.opts.reducedMotion ? 0 : 1);
    gl.bindVertexArray(this.vao!);
    gl.drawArrays(gl.POINTS, 0, this.layout.n);
    gl.bindVertexArray(null);
  }

  /** Fallback for browsers without WebGL2: same layout and colours, simpler glow. */
  private draw2D(t: number, intro: number) {
    const g = this.ctx2d;
    if (!g) return;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const bg = g.createRadialGradient(this.w / 2, this.h / 2, 0, this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.7);
    bg.addColorStop(0, "#1b1d38");
    bg.addColorStop(1, "#090c18");
    g.fillStyle = bg;
    g.fillRect(0, 0, this.w, this.h);
    this.project();
    g.globalCompositeOperation = "lighter";
    const c = this.layout.colors;
    for (let i = 0; i < this.layout.n; i++) {
      const d = this.screen[i * 3 + 2];
      if (d <= 0) continue;
      const st = this.states[i];
      const size = (st > 2.5 ? 7 : st > 1.5 ? 5 : st > 0.5 ? 3.5 : 1.3) * (i === this.hover ? 2 : 1) * Math.min(this.w, this.h) / 520 / d;
      const a = (st > 0.5 ? 0.9 : 0.3 * (0.7 + 0.3 * Math.sin(t + i))) * intro;
      g.fillStyle = `rgba(${(c[i * 3] * 255) | 0},${(c[i * 3 + 1] * 255) | 0},${(c[i * 3 + 2] * 255) | 0},${a})`;
      g.fillRect(this.screen[i * 3] - size / 2, this.screen[i * 3 + 1] - size / 2, Math.max(1, size), Math.max(1, size));
    }
    g.globalCompositeOperation = "source-over";
  }
}
