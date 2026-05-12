import { describe, expect, it } from "vitest";

import { paddedYAxisDomain } from "../lib/dashboard/chart-domain";

describe("dashboard chart domain helpers", () => {
  it("adds enough top buffer for curved finance line charts", () => {
    const [min, max] = paddedYAxisDomain([30_000, 40_000]);

    expect(min).toBe(27_500);
    expect(max).toBe(42_500);
  });

  it("keeps the lower bound at zero for positive-only values", () => {
    const [min, max] = paddedYAxisDomain([0, 100]);

    expect(min).toBe(0);
    expect(max).toBe(125);
  });

  it("adds visible buffer for flat data", () => {
    const [min, max] = paddedYAxisDomain([100, 100]);

    expect(min).toBe(75);
    expect(max).toBe(125);
  });
});
