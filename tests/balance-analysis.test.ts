import { describe, expect, it } from "vitest";

import { applyBalanceAnalysisView, resolveBalanceAnalysisView } from "../lib/balance-analysis";
import { FlattedBalanceType } from "../lib/definitions";

const baseBalance = (overrides: Partial<FlattedBalanceType>): FlattedBalanceType => ({
  id: 1,
  date: new Date("2026-03-01T00:00:00+08:00"),
  holdingId: 1,
  holding: {
    id: 1,
    name: "Holding",
    symbol: "SYM",
    typeId: 1,
    type: {
      id: 1,
      name: "Assets",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    categoryId: 1,
    category: {
      id: 1,
      name: "Cash",
      isHide: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    userId: "user-1",
    updatedAt: new Date(),
    createdAt: new Date(),
  },
  quantity: 1,
  price: 1,
  value: 1,
  currency: "USD",
  note: "",
  userId: "user-1",
  user: undefined,
  priceStatus: "success",
  priceFetchedAt: null,
  priceSource: null,
  priceError: null,
  isTestData: false,
  updatedAt: new Date(),
  createdAt: new Date(),
  holdingName: "Holding",
  holdingSymbol: "SYM",
  holdingCategoryName: "Cash",
  holdingTypeName: "Assets",
  percentage: 0,
  ...overrides,
});

describe("balance analysis helpers", () => {
  it("resolves supported analysis views and falls back to all", () => {
    expect(resolveBalanceAnalysisView("cash")).toBe("cash");
    expect(resolveBalanceAnalysisView("crypto")).toBe("crypto");
    expect(resolveBalanceAnalysisView("stock")).toBe("stock");
    expect(resolveBalanceAnalysisView("unknown")).toBe("all");
    expect(resolveBalanceAnalysisView(undefined)).toBe("all");
  });

  it("filters to asset rows and computes percentages for all view", () => {
    const rows = [
      baseBalance({ id: 1, value: 100, holdingCategoryName: "Cash" }),
      baseBalance({ id: 2, value: 300, holdingCategoryName: "Cryptocurrency" }),
      baseBalance({ id: 3, value: 50, holdingCategoryName: "Listed stock" }),
      baseBalance({ id: 4, value: 999, holdingCategoryName: "Cash", holdingTypeName: "Liabilities" }),
    ];

    const result = applyBalanceAnalysisView(rows, "all");

    expect(result).toHaveLength(3);
    expect(result.map((row) => row.id)).toEqual([1, 2, 3]);
    expect(result[0].percentage).toBeCloseTo(100 / 450);
    expect(result[1].percentage).toBeCloseTo(300 / 450);
    expect(result[2].percentage).toBeCloseTo(50 / 450);
  });

  it("filters category-specific views using the selected asset total", () => {
    const rows = [
      baseBalance({ id: 1, value: 100, holdingCategoryName: "Cash" }),
      baseBalance({ id: 2, value: 300, holdingCategoryName: "Cryptocurrency" }),
      baseBalance({ id: 3, value: 200, holdingCategoryName: "Cryptocurrency" }),
      baseBalance({ id: 4, value: 50, holdingCategoryName: "Listed stock" }),
      baseBalance({ id: 5, value: 500, holdingCategoryName: "Unlisted stock" }),
    ];

    const cash = applyBalanceAnalysisView(rows, "cash");
    const crypto = applyBalanceAnalysisView(rows, "crypto");
    const stock = applyBalanceAnalysisView(rows, "stock");

    expect(cash.map((row) => row.id)).toEqual([1]);
    expect(cash[0].percentage).toBe(1);

    expect(crypto.map((row) => row.id)).toEqual([2, 3]);
    expect(crypto[0].percentage).toBeCloseTo(300 / 500);
    expect(crypto[1].percentage).toBeCloseTo(200 / 500);

    expect(stock.map((row) => row.id)).toEqual([4]);
    expect(stock[0].percentage).toBe(1);
  });

  it("returns 0 percentage when the selected view total is zero", () => {
    const rows = [
      baseBalance({ id: 1, value: 0, holdingCategoryName: "Cash" }),
      baseBalance({ id: 2, value: 0, holdingCategoryName: "Cash" }),
    ];

    const result = applyBalanceAnalysisView(rows, "cash");

    expect(result).toHaveLength(2);
    expect(result.every((row) => row.percentage === 0)).toBe(true);
  });
});
