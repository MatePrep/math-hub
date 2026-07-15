import { useEffect, useRef } from "react";

// Ties an element's translateY to how far it sits from viewport center while
// scrolling, exposed as the --parallax-y custom property (consumer decides
// how much of it to use via `translateY(var(--parallax-y, 0px))`). Disabled
// outright under prefers-reduced-motion, like the rest of the landing's motion.
//
// The homepage stacks up to a dozen of these (hero glows, section watermarks,
// the ambient mesh, section photos). Each instance used to own its own
// scroll listener + rAF + getBoundingClientRect(): with that many mounted at
// once, a single scroll tick fired a dozen independent read/write cycles
// that the browser could interleave (read, write, read, write, ...) —
// classic layout thrashing, and the likely cause of scroll feeling like it
// drops input under load. This module keeps one shared scroll/resize
// listener and one shared rAF for the whole page: every mounted target's
// geometry is read first, then every write happens, so the browser lays
// out once per frame no matter how many parallax layers are on screen.
type ParallaxTarget = {
  node: HTMLElement;
  speed: number;
  maxPx: number;
};

const targets = new Set<ParallaxTarget>();
let rafId = 0;
let listenersAttached = false;

function updateAll() {
  rafId = 0;
  const viewportHeight = window.innerHeight;
  // Read phase — every target's geometry, before any style is touched.
  const offsets = new Map<ParallaxTarget, number>();
  targets.forEach((target) => {
    const rect = target.node.getBoundingClientRect();
    const center = rect.top + rect.height / 2 - viewportHeight / 2;
    offsets.set(target, Math.max(-target.maxPx, Math.min(target.maxPx, -center * target.speed)));
  });
  // Write phase.
  offsets.forEach((offset, target) => {
    target.node.style.setProperty("--parallax-y", `${offset.toFixed(1)}px`);
  });
}

function scheduleUpdate() {
  if (rafId) return;
  rafId = requestAnimationFrame(updateAll);
}

function attachListeners() {
  if (listenersAttached) return;
  listenersAttached = true;
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
}

function detachListenersIfIdle() {
  if (targets.size > 0) return;
  listenersAttached = false;
  window.removeEventListener("scroll", scheduleUpdate);
  window.removeEventListener("resize", scheduleUpdate);
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

export function useParallax<T extends HTMLElement>(speed = 0.06, maxPx = 40) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target: ParallaxTarget = { node, speed, maxPx };
    targets.add(target);
    attachListeners();
    scheduleUpdate();

    return () => {
      targets.delete(target);
      detachListenersIfIdle();
    };
    // speed/maxPx are expected to stay constant across a given hook call, like a config value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
