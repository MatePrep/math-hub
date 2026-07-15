import { useEffect, useRef } from "react";

// Fraction (0-1) of the document's scrollable height that's been scrolled —
// drives the landing page's top progress rail. Writes width directly to the
// returned element (imperative, no React state) instead of re-rendering the
// whole page on every scroll frame — same pattern as useParallax/
// usePointerTilt, and the one that matters most here since this page's
// component tree is large. Kept active under prefers-reduced-motion (it's a
// position indicator, not decorative motion); only the CSS transition
// smoothing its width is what reduced-motion trims, handled at the call site.
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const node = ref.current;
      if (!node) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      node.style.width = `${progress * 100}%`;
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
  }, []);

  return ref;
}
