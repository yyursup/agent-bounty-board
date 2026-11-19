"use client";

import { useEffect, useState } from "react";

import styles from "./Mailbag.module.css";

export type Flight = { rating: number; from: DOMRect; to: DOMRect };

/** The rating stamp lifting off the sheet and landing on the carrier's passport. */
export function FlyingStamp({ flight, onLanded }: { flight: Flight; onLanded: () => void }) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setGo(true)));
    const done = setTimeout(onLanded, 820);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(done);
    };
  }, [onLanded]);

  const dx = flight.to.left - flight.from.left - 6;
  const dy = flight.to.top - flight.from.top - 10;
  return (
    <span
      aria-hidden="true"
      className={styles.flyer}
      style={{
        left: flight.from.left,
        top: flight.from.top,
        transform: go ? `translate(${dx}px, ${dy}px) scale(.6) rotate(-24deg)` : "rotate(-6deg)",
        opacity: go ? 0.85 : 1,
      }}
    >
      {flight.rating}
    </span>
  );
}
