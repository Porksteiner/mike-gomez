// Tier-3 signature moment: a WebGL "space-folds" hero.
// Kaleidoscope polar-mirror + domain-warped fbm field + chromatic split,
// scroll-scrubbed via a pinned ScrollTrigger and smoothed by Lenis.
// Lightweight (OGL, full-screen triangle). Reduced-motion + offscreen safe.
// See _sauce/03-MOTION-SYSTEM.md §Doctor-Strange playbook.

import { Renderer, Program, Mesh, Triangle } from 'ogl';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const vertex = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uProgress;
uniform vec2 uMouse;
uniform vec2 uResolution;

#define PI 3.14159265359
#define TAU 6.28318530718

float hash(vec2 p){
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

// dimensional intensity field with domain warp
float fieldI(vec2 uv){
  float t = uTime * 0.05;
  vec2 q = vec2(fbm(uv + t), fbm(uv + vec2(5.2, 1.3) - t));
  float n = fbm(uv + 2.0 * q + t);
  float r = length(uv);
  float rings = sin(r * 9.0 - uTime * 0.6 + n * 4.0);
  float glow = smoothstep(0.7, 0.0, r);
  return n * 0.7 + rings * 0.14 + glow * 0.55;
}

vec3 palette(float i, float glow){
  vec3 voidc = vec3(0.03, 0.03, 0.045);
  vec3 gold  = vec3(0.79, 0.64, 0.42);
  vec3 hot   = vec3(0.95, 0.83, 0.55);
  vec3 col = mix(voidc, gold, smoothstep(0.08, 0.70, i));
  col = mix(col, hot, smoothstep(0.72, 1.05, i) * glow);
  return col;
}

void main(){
  vec2 uv = vUv - 0.5;
  uv.x *= uResolution.x / uResolution.y;
  uv += uMouse * 0.04;

  // push in through the portal as you scroll
  uv *= mix(1.45, 0.40, uProgress);

  // rotate over time + scroll
  float ang = uTime * 0.03 + uProgress * PI;
  float s = sin(ang), c = cos(ang);
  uv = mat2(c, -s, s, c) * uv;

  // kaleidoscope fold (polar mirror by N sides) — "the mirror dimension"
  float sides = mix(6.0, 12.0, uProgress);
  float a = atan(uv.y, uv.x);
  float rad = length(uv);
  a = mod(a, TAU / sides);
  a = abs(a - PI / sides);
  vec2 kuv = vec2(cos(a), sin(a)) * rad;

  // chromatic split (prismatic edge)
  float glow = smoothstep(0.7, 0.0, rad);
  float ca = 0.012 + uProgress * 0.02;
  vec3 col = vec3(
    palette(fieldI(kuv + vec2(ca, 0.0)), glow).r,
    palette(fieldI(kuv), glow).g,
    palette(fieldI(kuv - vec2(ca, 0.0)), glow).b
  );

  // vignette
  col *= smoothstep(1.25, 0.15, length(vUv - 0.5));
  gl_FragColor = vec4(col, 1.0);
}
`;

export function initSpacefold(canvas: HTMLCanvasElement): () => void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  const renderer = new Renderer({
    canvas,
    alpha: false,
    dpr: Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2),
  });
  const gl = renderer.gl;
  gl.clearColor(0.03, 0.03, 0.045, 1);

  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uMouse: { value: [0, 0] as [number, number] },
      uResolution: { value: [1, 1] as [number, number] },
    },
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

  const hero = (canvas.closest('section') as HTMLElement) ?? (canvas.parentElement as HTMLElement);
  const heroInner = hero.querySelector<HTMLElement>('.hero-inner');

  const resize = () => {
    const rect = hero.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
    program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
  };
  resize();
  window.addEventListener('resize', resize);

  let mx = 0, my = 0;
  const onPointer = (e: PointerEvent) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = -(e.clientY / window.innerHeight - 0.5) * 2;
  };
  if (!reduce) window.addEventListener('pointermove', onPointer);

  // scroll-scrubbed fold: pin the hero, drive uProgress 0..1
  let st: ScrollTrigger | undefined;
  if (!reduce) {
    st = ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: '+=120%',
      pin: true,
      scrub: 1,
      onUpdate: (self) => {
        program.uniforms.uProgress.value = self.progress;
        if (heroInner) {
          const fade = 1 - Math.min(1, Math.max(0, (self.progress - 0.15) / 0.45));
          heroInner.style.opacity = String(fade);
          heroInner.style.transform = `translateY(${-self.progress * 40}px)`;
        }
      },
    });
  } else {
    program.uniforms.uProgress.value = 0.14;
  }

  let raf = 0;
  const startT = performance.now();
  const frame = (now: number) => {
    program.uniforms.uTime.value = (now - startT) / 1000;
    program.uniforms.uMouse.value = [mx, my];
    renderer.render({ scene: mesh });
    raf = requestAnimationFrame(frame);
  };

  let io: IntersectionObserver | undefined;
  if (reduce) {
    // a single static dimensional frame — no animation
    program.uniforms.uTime.value = 8.0;
    renderer.render({ scene: mesh });
  } else {
    // pause the loop when the hero scrolls out of view (battery/perf)
    io = new IntersectionObserver(
      (entries) => {
        const onscreen = entries[0].isIntersecting;
        if (onscreen && !raf) raf = requestAnimationFrame(frame);
        else if (!onscreen && raf) { cancelAnimationFrame(raf); raf = 0; }
      },
      { threshold: 0 },
    );
    io.observe(hero);
    raf = requestAnimationFrame(frame);
  }

  return () => {
    if (raf) cancelAnimationFrame(raf);
    io?.disconnect();
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onPointer);
    st?.kill();
  };
}
