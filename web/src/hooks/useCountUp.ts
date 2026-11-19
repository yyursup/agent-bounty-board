"use client";

import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "./useReducedMotion";

/** Eases a displayed number towards `target` whenever it changes. */
export function useCountUp(target: number, durationMs = 520): number {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    if (reduce || !Number.isFinite(target)) {
      setShown(target);
      return;
    }
    const start = from.current;
    let t0: number | null = null;
    let frame = 0;
    const step = (ts: number) => {
      t0 ??= ts;
      const k = Math.min(1, (ts - t0) / durationMs);
      const value = start + (target - start) * (1 - Math.pow(1 - k, 4));
      from.current = value;
      setShown(value);
      if (k < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, reduce]);

  return shown;
}
