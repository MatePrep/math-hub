import { useEffect, useState } from "react";

// Counts from 0 to `target` with an ease-out-quart curve once `active` flips
// true — for stat numbers revealing as instrument readouts. Jumps straight to
// the target under prefers-reduced-motion.
export function useCountUp(target: number, active: boolean, durationMs = 1100) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 4))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, durationMs]);

  return value;
}
