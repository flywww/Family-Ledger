import { describe, expect, it } from "vitest";

import { getBalancePricePrefill } from "../lib/balance-price-prefill";

const baseHolding = {
  id: 1,
  name: "Vanguard S&P 500 ETF",
  symbol: "VOO",
  typeId: 1,
  type: {
    id: 1,
    name: "Assets",
    isHide: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  },
  categoryId: 1,
  category: {
    id: 1,
    name: "ETF",
    isHide: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  },
  userId: "user-1",
  sourceURL: "https://financialmodelingprep.com/stable/search-symbol?",
  sourceId: "VOO",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

describe("balance price prefill", () => {
  it("treats existing ETF holdings as USD listed securities", () => {
    expect(getBalancePricePrefill(baseHolding)).toEqual({
      kind: "listed-security",
      sourceId: "VOO",
      currency: "USD",
    });
  });

  it("does not request a quote when source metadata is missing", () => {
    expect(getBalancePricePrefill({ ...baseHolding, sourceId: null })).toBeNull();
  });
});
