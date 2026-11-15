// Tier-1 motion baseline + orchestration. See _sauce/03-MOTION-SYSTEM.md.
// Lenis smooth scroll (ticker-synced to GSAP), authored scroll-reveals,
// custom cursor + magnetic CTAs, scroll progress, mobile nav, and the
// code-split Tier-3 space-folds hero. Everything is reduced-motion aware.

import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let cleanup: (() => void) | null = null;

function init() {
  if (cleanup) return;
  (window as any).__motionReady = true;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const disposers: Array<() => void> = [];

  // ---- Lenis smooth scroll (single GSAP ticker owns the RAF loop) ----
  let lenis: Lenis | null = null;
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.1, duration: 1.2, smoothWheel: true, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis!.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    disposers.push(() => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
    });
  }

  // ---- Authored scroll-reveals (stagger + easing, never uniform) ----
  if (reduce) {
    gsap.set('.reveal', { opacity: 1, y: 0 });
  } else {
    ScrollTrigger.batch('.reveal', {
      start: 'top 88%',
      onEnter: (els) =>
        gsap.to(els, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.08,
          overwrite: true,
        }),
    });
  }

  // ---- Hero headline: brand-fit kinetic reveal (masked lines + hand-drawn underline) ----
  // Text is visible by DEFAULT (CSS); motion only ENHANCES via gsap.from(), so it
  // can never be left blank if JS/anim doesn't run.
  if (!reduce) {
    const heroLines = gsap.utils.toArray('.hero-title .hl-in');
    if (heroLines.length) {
      gsap.from(heroLines, { yPercent: 115, duration: 1.0, ease: 'power4.out', stagger: 0.1, delay: 0.15 });
    }
    const ulPath = document.querySelector('.hl-underline path') as SVGPathElement | null;
    if (ulPath) {
      const len = ulPath.getTotalLength();
      gsap.set(ulPath, { strokeDasharray: len });
      gsap.fromTo(ulPath, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut', delay: 1.1 });
    }
  }

  // ---- Scroll progress bar ----
  const bar = document.getElementById('scroll-progress');
  if (bar) {
    if (reduce) {
      bar.style.transform = 'scaleX(0)';
    } else {
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          bar.style.transform = `scaleX(${self.progress})`;
        },
      });
    }
  }

  // ---- Custom cursor + magnetic CTAs (desktop fine-pointer only) ----
  if (fine && !reduce) {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (dot && ring) {
      let rx = 0, ry = 0, mx = 0, my = 0;
      const onMove = (e: PointerEvent) => {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = `translate(${mx}px, ${my}px)`;
      };
      window.addEventListener('pointermove', onMove);
      const ring_tick = () => {
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        ring.style.transform = `translate(${rx}px, ${ry}px)`;
      };
      gsap.ticker.add(ring_tick);
      const targets = document.querySelectorAll('a, button, [data-cursor]');
      const enter = () => document.body.classList.add('cursor-hover');
      const leave = () => document.body.classList.remove('cursor-hover');
      targets.forEach((el) => {
        el.addEventListener('pointerenter', enter);
        el.addEventListener('pointerleave', leave);
      });
      disposers.push(() => {
        window.removeEventListener('pointermove', onMove);
        gsap.ticker.remove(ring_tick);
      });
    }

    document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((node) => {
      const onMove = (e: PointerEvent) => {
        const r = node.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        gsap.to(node, { x: x * 0.3, y: y * 0.4, duration: 0.4, ease: 'power3.out' });
      };
      const onLeave = () => gsap.to(node, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      node.addEventListener('pointermove', onMove);
      node.addEventListener('pointerleave', onLeave);
    });
  }

  // ---- Mobile nav toggle (with scroll-lock) ----
  const toggle = document.querySelector<HTMLButtonElement>('.nav-toggle');
  const menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    const setOpen = (open: boolean) => {
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  }

  // ---- Tier-3 signature moment: space-folds hero (code-split) ----
  let foldDispose: (() => void) | null = null;
  const canvas = document.getElementById('spacefold-canvas') as HTMLCanvasElement | null;
  if (canvas) {
    import('./spacefold')
      .then((m) => {
        foldDispose = m.initSpacefold(canvas);
        ScrollTrigger.refresh();
      })
      .catch((err) => console.error('[spacefold] failed to load', err));
  }

  ScrollTrigger.refresh();

  cleanup = () => {
    disposers.forEach((d) => d());
    foldDispose?.();
    ScrollTrigger.getAll().forEach((t) => t.kill());
    document.body.style.overflow = '';
  };
}

function teardown() {
  cleanup?.();
  cleanup = null;
}

export function initMotion() {
  // Runs on first load and after every view transition; idempotent.
  document.addEventListener('astro:page-load', init);
  document.addEventListener('astro:before-swap', teardown);
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init, { once: true });
}
