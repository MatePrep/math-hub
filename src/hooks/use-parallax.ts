import { useEffect, useRef } from "react";

// Ties an element's translateY to how far it sits from viewport center while
// scrolling, exposed as the --parallax-y custom property (consumer decides
// how much of it to use via `translateY(var(--parallax-y, 0px))`). Disabled
// outright under prefers-reduced-motion, like the rest of the landing's motion.
export function useParallax<T extends HTMLElement>(speed = 0.06, maxPx = 40) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = node.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      const offset = Math.max(-maxPx, Math.min(maxPx, -center * speed));
      node.style.setProperty("--parallax-y", `${offset.toFixed(1)}px`);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
    // speed/maxPx are expected to stay constant across a given hook call, like a config value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
