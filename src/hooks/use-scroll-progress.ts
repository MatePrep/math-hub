import { useEffect, useState } from "react";

// Fraction (0-1) of the document's scrollable height that's been scrolled —
// drives the landing page's top progress rail. Kept simple on purpose: it's
// a position indicator, not decorative motion, so it stays active even under
// prefers-reduced-motion (only the CSS transition smoothing its width is
// what reduced-motion trims, handled at the call site).
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0);
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

  return progress;
}
