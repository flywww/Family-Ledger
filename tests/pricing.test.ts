import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  FMP_STOCK_SEARCH_URL,
  FMP_STOCK_QUOTE_URL,
  FMP_STOCK_QUOTE_SHORT_URL,
  YAHOO_CHART_URL,
  TPEX_DAILY_CLOSE_URL,
  TPEX_PROFILE_URL,
  TWSE_DAILY_CLOSE_URL,
  TWSE_PROFILE_URL,
  fetchFmpListedSecuritiesFromAPI,
  fetchListedStockPriceFromAPI,
  fetchQuoteForSource,
  fetchTaiwanListedStocksFromAPI,
  getHoldingQuoteSource,
  parseTaiwanStockSourceId,
} from "../lib/pricing";

function jsonResponse(data: unknown, ok = true, status = ok ? 200 : 500) {
  return {
    ok,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response;
}

const twseQuoteRows = [
  {
    Code: "0050",
    Name: "元大台灣50",
    ClosingPrice: "62.40",
  },
  {
    Code: "2308",
    Name: "台達電",
    ClosingPrice: "987.00",
  },
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
    公司代號: "0050",
    公司簡稱: "元大台灣50",
    英文簡稱: "YUANTA TAIWAN TOP 50 ETF",
  },
  {
    公司代號: "2308",
    公司簡稱: "台達電",
    英文簡稱: "DELTA",
  },
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

const fmpSearchRows = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    exchange: "NASDAQ",
  },
  {
    symbol: "VT",
    name: "Vanguard Total World Stock ETF",
    exchange: "AMEX",
  },
  {
    symbol: "VOO",
    name: "Vanguard S&P 500 ETF",
    exchange: "AMEX",
  },
  {
    symbol: "QQQ",
    name: "Invesco QQQ Trust",
    exchange: "NASDAQ",
  },
  {
    symbol: "XLK",
    name: "Technology Select Sector SPDR Fund",
    exchange: "AMEX",
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    exchange: "NASDAQ",
  },
  {
    symbol: "SHOP.TO",
    name: "Shopify Inc.",
    exchange: "Toronto Stock Exchange",
  },
];

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubEnv("FMP_STOCK_API_KEY", "test-fmp-key");
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
      if (href.startsWith(FMP_STOCK_SEARCH_URL)) {
        return jsonResponse(fmpSearchRows);
      }
      if (href.startsWith(FMP_STOCK_QUOTE_URL)) {
        const symbol = new URL(href).searchParams.get("symbol");
        if (symbol === "XLK" || symbol === "VT") {
          return jsonResponse(
            {
              "Error Message": "Premium Query Parameter",
            },
            false,
            402,
          );
        }
        if (symbol === "VOO") {
          return jsonResponse([
            {
              symbol: "VOO",
              price: 502.42,
            },
          ]);
        }
        if (symbol === "ZERO") {
          return jsonResponse([
            {
              symbol: "ZERO",
              price: 0,
            },
          ]);
        }
        return jsonResponse([
          {
            symbol: "TSLA",
            price: 391,
          },
        ]);
      }
      if (href.startsWith(FMP_STOCK_QUOTE_SHORT_URL)) {
        const symbol = new URL(href).searchParams.get("symbol");
        if (symbol === "XLK") {
          return jsonResponse(
            {
              "Error Message": "Premium Query Parameter",
            },
            false,
            402,
          );
        }
        if (symbol === "VT") {
          return jsonResponse([
            {
              symbol: "VT",
              price: 156.17,
            },
          ]);
        }
      }
      if (href.startsWith(YAHOO_CHART_URL)) {
        const symbol = decodeURIComponent(href.replace(YAHOO_CHART_URL, "").split("?")[0]);
        if (symbol === "XLK") {
          return jsonResponse({
            chart: {
              result: [
                {
                  meta: {
                    currency: "USD",
                    regularMarketPrice: 180.59,
                  },
                },
              ],
            },
          });
        }
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

describe("US listed-stock pricing", () => {
  it("fetches unprefixed FMP symbols from the current stable quote endpoint", async () => {
    await expect(fetchListedStockPriceFromAPI("TSLA")).resolves.toBe(391);
  });

  it("fetches US ETF symbols from the same FMP listed-security quote endpoint", async () => {
    await expect(fetchListedStockPriceFromAPI("VOO")).resolves.toBe(502.42);
  });

  it("falls back to Yahoo chart when FMP blocks ETF quote endpoints", async () => {
    await expect(fetchListedStockPriceFromAPI("XLK")).resolves.toBe(180.59);
  });

  it("uses FMP quote-short when only the stable quote endpoint is blocked", async () => {
    await expect(fetchListedStockPriceFromAPI("VT")).resolves.toBe(156.17);
  });

  it("rejects invalid FMP zero prices instead of treating them as market quotes", async () => {
    await expect(fetchListedStockPriceFromAPI("ZERO")).rejects.toThrow(
      "FMP returned an invalid price for ZERO",
    );
  });
});

describe("Taiwan listed-stock search", () => {
  it("matches by code, display symbol, Chinese name, and free official English abbreviation", async () => {
    await expect(fetchTaiwanListedStocksFromAPI("0050")).resolves.toMatchObject([
      {
        name: "元大台灣50",
        symbol: "0050.TW",
        sourceId: "TWSE:0050",
        sourceURL: TWSE_DAILY_CLOSE_URL,
      },
    ]);
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
    await expect(fetchTaiwanListedStocksFromAPI("台達電")).resolves.toMatchObject([
      {
        name: "台達電",
        symbol: "2308.TW",
        sourceId: "TWSE:2308",
        sourceURL: TWSE_DAILY_CLOSE_URL,
      },
    ]);
    await expect(fetchTaiwanListedStocksFromAPI("DELTA")).resolves.toHaveLength(1);
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

describe("Listed security search", () => {
  it("returns supported US stock and ETF rows from recognized FMP exchange labels", async () => {
    await expect(fetchFmpListedSecuritiesFromAPI("voo")).resolves.toEqual(
      expect.arrayContaining([
        {
          name: "Apple Inc.",
          symbol: "AAPL",
          sourceURL: FMP_STOCK_SEARCH_URL,
          sourceId: "AAPL",
        },
        {
          name: "Vanguard Total World Stock ETF",
          symbol: "VT",
          sourceURL: FMP_STOCK_SEARCH_URL,
          sourceId: "VT",
        },
        {
          name: "Vanguard S&P 500 ETF",
          symbol: "VOO",
          sourceURL: FMP_STOCK_SEARCH_URL,
          sourceId: "VOO",
        },
        {
          name: "Invesco QQQ Trust",
          symbol: "QQQ",
          sourceURL: FMP_STOCK_SEARCH_URL,
          sourceId: "QQQ",
        },
        {
          name: "Technology Select Sector SPDR Fund",
          symbol: "XLK",
          sourceURL: FMP_STOCK_SEARCH_URL,
          sourceId: "XLK",
        },
        {
          name: "Tesla, Inc.",
          symbol: "TSLA",
          sourceURL: FMP_STOCK_SEARCH_URL,
          sourceId: "TSLA",
        },
      ]),
    );

    await expect(fetchFmpListedSecuritiesFromAPI("voo")).resolves.not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: "SHOP.TO",
        }),
      ]),
    );
  });
});
