import { describe, expect, it } from "vitest";

import { formatClock, formatRemaining, shortAddress, splitAmount } from "./format";

describe("format", () => {
  it("splits token amounts for stamps", () => {
    expect(splitAmount(12_500_000_000_000_000_000n, 18)).toEqual({ whole: "12", cents: "50" });
  });

  it("describes time left", () => {
    expect(formatRemaining(2 * 86_400 + 14 * 3_600, 0)).toBe("2d 14h");
    expect(formatRemaining(41 * 3_600 + 12 * 60, 0)).toBe("1d 17h");
    expect(formatRemaining(9 * 60, 0)).toBe("9m");
    expect(formatRemaining(0, 100)).toBe("0m");
    expect(formatClock(41 * 3_600 + 12 * 60 + 7, 0)).toBe("41:12:07");
  });

  it("shortens addresses", () => {
    expect(shortAddress("0x4F2A000000000000000000000000000000091C3")).toBe("0x4F2A…91C3");
  });
});
