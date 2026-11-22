// Scroll motion for the homepage (Paper Theme UI motion spec: calm, cubic-bezier(0.2,0,0,1), no bounce).
import { useEffect, useRef, useState } from 'react';

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** [ref, visible]. `once` (default) latches true the first time the element is 15% on screen. */
export function useReveal(once = true) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setOn(true); return undefined; }
    const io = new IntersectionObserver(([e]) => {
      if (once) { if (e.isIntersecting) { setOn(true); io.disconnect(); } } else setOn(e.isIntersecting);
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [once]);
  return [ref, on];
}

/** Counts from `from` to `to` over `ms` once `run` is true (ease-out). Reduced motion jumps straight to `to`. */
export function useCount(to, run, { from = 0, ms = 900, decimals = 0 } = {}) {
  const [v, setV] = useState(from);
  useEffect(() => {
    if (!run) return undefined;
    if (reduced()) { setV(to); return undefined; }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(from + (to - from) * (1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run, from, ms]);
  return v.toFixed(decimals);
}
