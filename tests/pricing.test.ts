import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  TPEX_DAILY_CLOSE_URL,
  TPEX_PROFILE_URL,
  TWSE_DAILY_CLOSE_URL,
  TWSE_PROFILE_URL,
  fetchListedStockPriceFromAPI,
  fetchQuoteForSource,
  fetchTaiwanListedStocksFromAPI,
  getHoldingQuoteSource,
  parseTaiwanStockSourceId,
} from "../lib/pricing";

function jsonResponse(data: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response;
}

const twseQuoteRows = [
  {
    Code: "2330",
    Name: "台積電",
    ClosingPrice: "875.00",
  },
  {
    Code: "2317",
    Name: "鴻海",
    ClosingPrice: "--",
  },
];

const tpexQuoteRows = [
  {
    SecuritiesCompanyCode: "8069",
    CompanyName: "元太",
    Close: "271.50",
  },
];

const twseProfileRows = [
  {
    公司代號: "2330",
    公司簡稱: "台積電",
    英文簡稱: "TSMC",
  },
];

const tpexProfileRows = [
  {
    SecuritiesCompanyCode: "8069",
    CompanyName: "元太科技",
    Symbol: "EIH",
  },
];

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL | Request) => {
      const href = url.toString();
      if (href === TWSE_DAILY_CLOSE_URL) {
        return jsonResponse(twseQuoteRows);
      }
      if (href === TPEX_DAILY_CLOSE_URL) {
        return jsonResponse(tpexQuoteRows);
      }
      if (href === TWSE_PROFILE_URL) {
        return jsonResponse(twseProfileRows);
      }
      if (href === TPEX_PROFILE_URL) {
        return jsonResponse(tpexProfileRows);
      }

      return jsonResponse({ error: "unexpected URL" }, false);
    }),
  );
});

describe("Taiwan stock source parsing", () => {
  it("routes prefixed TWSE and TPEx source IDs while preserving unprefixed FMP symbols", () => {
    expect(parseTaiwanStockSourceId("TWSE:2330")).toEqual({
      provider: "twse",
      sourceKey: "2330",
    });
    expect(parseTaiwanStockSourceId("TPEX:8069")).toEqual({
      provider: "tpex",
      sourceKey: "8069",
    });
    expect(parseTaiwanStockSourceId("TSLA")).toBeNull();

    expect(
      getHoldingQuoteSource({
        sourceId: "TWSE:2330",
        symbol: "2330.TW",
        category: { name: "Listed stock" },
      } as any),
    ).toEqual({
      provider: "twse",
      sourceKey: "2330",
    });
    expect(
      getHoldingQuoteSource({
        sourceId: "TSLA",
        symbol: "TSLA",
        category: { name: "Listed stock" },
      } as any),
    ).toEqual({
      provider: "financialmodelingprep",
      sourceKey: "TSLA",
    });
  });
});

describe("Taiwan stock pricing", () => {
  it("fetches TWSE and TPEx daily close quotes as TWD quote results", async () => {
    await expect(fetchListedStockPriceFromAPI("TWSE:2330")).resolves.toBe(875);
    await expect(fetchListedStockPriceFromAPI("TPEX:8069")).resolves.toBe(271.5);

    await expect(
      fetchQuoteForSource({ provider: "twse", sourceKey: "2330" }),
    ).resolves.toMatchObject({
      provider: "twse",
      sourceKey: "2330",
      price: 875,
      currency: "TWD",
    });
    await expect(
      fetchQuoteForSource({ provider: "tpex", sourceKey: "8069" }),
    ).resolves.toMatchObject({
      provider: "tpex",
      sourceKey: "8069",
      price: 271.5,
      currency: "TWD",
    });
  });

  it("throws provider errors for missing or invalid Taiwan close prices", async () => {
    await expect(fetchListedStockPriceFromAPI("TWSE:2317")).rejects.toThrow(
      "TWSE returned an invalid close price for 2317",
    );
    await expect(fetchListedStockPriceFromAPI("TPEX:9999")).rejects.toThrow(
      "TPEX returned an invalid close price for 9999",
    );
  });
});

describe("Taiwan listed-stock search", () => {
  it("matches by code, display symbol, Chinese name, and free official English abbreviation", async () => {
    await expect(fetchTaiwanListedStocksFromAPI("2330")).resolves.toMatchObject([
      {
        name: "台積電",
        symbol: "2330.TW",
        sourceId: "TWSE:2330",
        sourceURL: TWSE_DAILY_CLOSE_URL,
      },
    ]);
    await expect(fetchTaiwanListedStocksFromAPI("2330.TW")).resolves.toHaveLength(1);
    await expect(fetchTaiwanListedStocksFromAPI("台積電")).resolves.toHaveLength(1);
    await expect(fetchTaiwanListedStocksFromAPI("TSMC")).resolves.toHaveLength(1);
    await expect(fetchTaiwanListedStocksFromAPI("8069.TWO")).resolves.toMatchObject([
      {
        name: "元太",
        symbol: "8069.TWO",
        sourceId: "TPEX:8069",
        sourceURL: TPEX_DAILY_CLOSE_URL,
      },
    ]);
    await expect(fetchTaiwanListedStocksFromAPI("元太")).resolves.toHaveLength(1);
    await expect(fetchTaiwanListedStocksFromAPI("EIH")).resolves.toHaveLength(1);
  });

  it("does not use paid, web-search, scraping, or env-backed fallback for unavailable English matches", async () => {
    await expect(fetchTaiwanListedStocksFromAPI("Taiwan Semiconductor")).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(4);
  });
});
