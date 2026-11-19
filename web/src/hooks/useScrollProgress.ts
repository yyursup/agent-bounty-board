"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * 0 when the element's top reaches 75% of the viewport, 1 once it has scrolled through
 * `span` of its own height. Used to move things along with the page.
 */
export function useScrollProgress(ref: RefObject<Element | null>, span = 0.6): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = (window.innerHeight * 0.75 - r.top) / (r.height * span);
      setProgress(Math.max(0, Math.min(1, p)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref, span]);
  return progress;
}
