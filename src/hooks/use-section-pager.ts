import { useEffect, useRef } from "react";

// "Red social" section paging: one mouse-wheel notch or arrow/space/PageDown
// key jumps a full section at a time with an animated scroll, instead of
// leaving a plain 3-notch mouse wheel to slowly nudge past the CSS
// scroll-snap points in styles.css. Scroll-snap alone reads as weak/
// inconsistent on wheel input (a single notch rarely crosses the browser's
// own snap threshold) — this is what actually delivers the TikTok/Reels
// "one flick = one section" feel on desktop. Touch is left to CSS snap +
// the browser's native momentum, which already reads right on a swipe. A
// section taller than one screen still scrolls normally within itself until
// you reach its edge — only then does the next gesture page to the
// neighboring section, so nothing on a long section becomes unreachable.

const WHEEL_THRESHOLD = 20; // px of deltaY below which a wheel tick is ignored (trackpad micro-jitter)
const EDGE_EPSILON = 6; // px tolerance for "already at this section's edge"
const LOCK_FALLBACK_MS = 700; // safety unlock if the `scrollend` event never fires

export function useSectionPager(containerRef: React.RefObject<HTMLElement | null>) {
  const lockedRef = useRef(false);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-snap-section]"));
    if (sections.length < 2) return;

    // Same offset the homepage's own CSS sets on <html> (scroll-padding-top,
    // to clear the sticky header) — read it back instead of duplicating the
    // number, so the two never drift apart.
    const headerOffset =
      parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;

    const currentIndex = () => {
      let idx = 0;
      sections.forEach((section, i) => {
        if (section.getBoundingClientRect().top <= headerOffset + EDGE_EPSILON) idx = i;
      });
      return idx;
    };

    const goTo = (el: HTMLElement) => {
      lockedRef.current = true;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      const unlock = () => {
        lockedRef.current = false;
      };
      document.addEventListener("scrollend", unlock, { once: true });
      window.setTimeout(unlock, LOCK_FALLBACK_MS);
    };

    // Returns true if the gesture was consumed (caller should preventDefault).
    const page = (forward: boolean) => {
      if (lockedRef.current) return true;
      const rect = sections[currentIndex()].getBoundingClientRect();

      if (forward) {
        if (rect.bottom - window.innerHeight > EDGE_EPSILON) return false;
        const next = sections[currentIndex() + 1];
        if (!next) return false;
        goTo(next);
        return true;
      }
      if (rect.top < headerOffset - EDGE_EPSILON) return false;
      const prev = sections[currentIndex() - 1];
      if (!prev) return false;
      goTo(prev);
      return true;
    };

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;
      if (page(e.deltaY > 0)) e.preventDefault();
    };

    const isInteractive = (el: Element | null) =>
      !!el && el !== document.body && el !== document.documentElement;

    const handleKey = (e: KeyboardEvent) => {
      if (isInteractive(document.activeElement)) return;
      const forward = e.key === "PageDown" || e.key === " " || e.key === "ArrowDown";
      const backward = e.key === "PageUp" || e.key === "ArrowUp";
      if (!forward && !backward) return;
      if (page(forward)) e.preventDefault();
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKey);
    };
  }, [containerRef]);
}
