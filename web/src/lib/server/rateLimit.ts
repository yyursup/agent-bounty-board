/**
 * A small sliding-window rate limiter kept in memory. On serverless hosts each instance keeps its
 * own window, so this is a brake on abuse rather than an exact quota.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();

  return function allow(key: string, now = Date.now()): boolean {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    // Keep the map from growing without bound on a long-lived instance.
    if (hits.size > 5000) {
      for (const [k, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
    return true;
  };
}

/** The caller's IP as reported by the hosting proxy, or a shared bucket when unknown. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown"
  );
}

/** True when a browser request comes from another site. Requests without Origin are let through. */
export function isCrossSite(headers: Headers): boolean {
  const origin = headers.get("origin");
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}
