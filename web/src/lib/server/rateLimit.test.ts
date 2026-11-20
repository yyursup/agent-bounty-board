import { describe, expect, it } from "vitest";

import { clientIp, createRateLimiter, isCrossSite } from "./rateLimit";

describe("createRateLimiter", () => {
  it("allows up to the limit inside the window, then refuses", () => {
    const allow = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(allow("a", 0)).toBe(true);
    expect(allow("a", 10)).toBe(true);
    expect(allow("a", 20)).toBe(false);
    expect(allow("b", 20)).toBe(true);
  });

  it("frees a slot once the oldest hit leaves the window", () => {
    const allow = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(allow("a", 0)).toBe(true);
    expect(allow("a", 999)).toBe(false);
    expect(allow("a", 1000)).toBe(true);
  });
});

describe("request helpers", () => {
  it("reads the first forwarded IP", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers())).toBe("unknown");
  });

  it("flags requests from another site only", () => {
    expect(isCrossSite(new Headers({ origin: "https://abb.app", host: "abb.app" }))).toBe(false);
    expect(isCrossSite(new Headers({ origin: "https://evil.example", host: "abb.app" }))).toBe(
      true,
    );
    expect(isCrossSite(new Headers({ host: "abb.app" }))).toBe(false);
  });
});
