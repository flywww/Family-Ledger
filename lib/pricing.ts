import { categoryListType, Holding } from "./definitions";

export type QuoteProvider = "coinmarketcap" | "financialmodelingprep" | "twse" | "tpex";

export type QuoteSource = {
  provider: QuoteProvider;
  sourceKey: string;
};

export type QuoteResult = QuoteSource & {
  price: number;
  currency: "USD" | "TWD";
  fetchedAt: Date;
};

export const CMC_IDS_PER_CALL = 8;
export const TWSE_DAILY_CLOSE_URL = "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL";
export const TPEX_DAILY_CLOSE_URL =
  "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes";
export const TWSE_PROFILE_URL = "https://openapi.twse.com.tw/v1/opendata/t187ap03_L";
export const TPEX_PROFILE_URL = "https://www.tpex.org.tw/openapi/v1/mopsfin_t187ap03_O";

export type TaiwanStockProvider = "twse" | "tpex";

type ProviderPrefix = "TWSE" | "TPEX";

type TaiwanStockQuoteRow = Record<string, unknown>;
type TaiwanStockProfileRow = Record<string, unknown>;

type TaiwanStockSearchResult = {
  name: string;
  symbol: string;
  sourceURL: string;
  sourceId: string;
};

const TAIWAN_PROVIDER_PREFIXES: Record<ProviderPrefix, TaiwanStockProvider> = {
  TWSE: "twse",
  TPEX: "tpex",
};

const TAIWAN_PROVIDER_DISPLAY_SUFFIX: Record<TaiwanStockProvider, string> = {
  twse: "TW",
  tpex: "TWO",
};

export function getHoldingQuoteSource(
  holding: Pick<Holding, "sourceId" | "category" | "symbol">,
): QuoteSource | null {
  if (!holding.sourceId || !holding.category?.name) {
    return null;
  }

  const categoryName = holding.category.name as categoryListType;
  if (categoryName === "Cryptocurrency") {
    return {
      provider: "coinmarketcap",
      sourceKey: holding.sourceId.toString(),
    };
  }

  if (categoryName === "Listed stock") {
    const taiwanSource = parseTaiwanStockSourceId(holding.sourceId.toString());
    if (taiwanSource) {
      return taiwanSource;
    }

    return {
      provider: "financialmodelingprep",
      sourceKey: holding.sourceId.toString(),
    };
  }

  return null;
}

export function parseTaiwanStockSourceId(sourceId: string): QuoteSource | null {
  const match = sourceId.trim().match(/^(TWSE|TPEX):(\d{4,6})$/i);
  if (!match) {
    return null;
  }

  const prefix = match[1].toUpperCase() as ProviderPrefix;
  return {
    provider: TAIWAN_PROVIDER_PREFIXES[prefix],
    sourceKey: match[2],
  };
}

function getStringField(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number") {
      return value.toString();
    }
  }

  return "";
}

function parseTaiwanClosePrice(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/,/g, "").trim();
  if (!normalized || normalized === "--" || normalized === "-") {
    return null;
  }

  const price = Number(normalized);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function getTaiwanStockCode(row: TaiwanStockQuoteRow | TaiwanStockProfileRow) {
  return getStringField(row, [
    "Code",
    "SecuritiesCompanyCode",
    "公司代號",
    "有價證券代號",
    "股票代號",
    "代號",
  ]);
}

function getTaiwanStockName(row: TaiwanStockQuoteRow | TaiwanStockProfileRow) {
  return getStringField(row, [
    "Name",
    "CompanyName",
    "公司名稱",
    "公司簡稱",
    "有價證券名稱",
    "名稱",
  ]);
}

function getTaiwanStockEnglishAbbreviation(row: TaiwanStockProfileRow) {
  return getStringField(row, ["英文簡稱", "EnglishName", "EnglishAbbr", "Symbol"]);
}

function getTaiwanStockClosePrice(row: TaiwanStockQuoteRow) {
  const rawClose = getStringField(row, [
    "ClosingPrice",
    "Close",
    "收盤價",
    "收盤",
    "ClosePrice",
    "最後成交價",
  ]);
  return parseTaiwanClosePrice(rawClose);
}

async function fetchJsonArray(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Taiwan stock provider ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Taiwan stock provider returned an invalid response");
  }

  return data as TaiwanStockQuoteRow[];
}

export async function fetchTaiwanStockPriceFromAPI(
  provider: TaiwanStockProvider,
  code: string,
) {
  const rows = await fetchJsonArray(
    provider === "twse" ? TWSE_DAILY_CLOSE_URL : TPEX_DAILY_CLOSE_URL,
  );
  const row = rows.find((candidate) => getTaiwanStockCode(candidate) === code);
  const price = row ? getTaiwanStockClosePrice(row) : null;

  if (price === null) {
    throw new Error(`${provider.toUpperCase()} returned an invalid close price for ${code}`);
  }

  return price;
}

export async function fetchCryptoQuotesBatchFromAPI(ids: string[]) {
  const apiKey = process.env.CMC_API_KEY;
  if (!apiKey) {
    throw new Error("CMC API key is missing");
  }

  const uniqueIds = Array.from(
    new Set(ids.map((id) => id.trim()).filter((id) => id.length > 0)),
  );
  if (uniqueIds.length === 0) {
    return {};
  }
  if (uniqueIds.length > CMC_IDS_PER_CALL) {
    throw new Error(
      `CoinMarketCap batch size exceeds supported limit of ${CMC_IDS_PER_CALL} ids per request`,
    );
  }

  const response = await fetch(
    `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${uniqueIds.join(",")}`,
    {
      headers: {
        "X-CMC_PRO_API_KEY": apiKey,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CoinMarketCap ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data?.data ?? {};
}

export async function fetchCryptoPriceFromAPI(id: string) {
  const data = await fetchCryptoQuotesBatchFromAPI([id]);
  const price = data?.[id?.toString()]?.quote?.USD?.price;
  if (typeof price !== "number") {
    throw new Error(`CoinMarketCap returned an invalid price for ${id}`);
  }

  return price;
}

export async function fetchListedStockPriceFromAPI(symbol: string) {
  const taiwanSource = parseTaiwanStockSourceId(symbol);
  if (taiwanSource?.provider === "twse" || taiwanSource?.provider === "tpex") {
    return fetchTaiwanStockPriceFromAPI(taiwanSource.provider, taiwanSource.sourceKey);
  }

  const apiKey = process.env.FMP_STOCK_API_KEY;
  if (!apiKey) {
    throw new Error("FMP stock API key is missing");
  }

  const response = await fetch(
    `https://financialmodelingprep.com/api/v3/otc/real-time-price/${symbol}?apikey=${apiKey}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FMP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const price = Array.isArray(data) ? data[0]?.lastSalePrice : data?.lastSalePrice;
  if (typeof price !== "number") {
    throw new Error(`FMP returned an invalid price for ${symbol}`);
  }

  return price;
}

async function loadTaiwanStockSearchData(params: {
  provider: TaiwanStockProvider;
  quoteUrl: string;
  profileUrl: string;
  sourcePrefix: ProviderPrefix;
}) {
  const [quoteRows, profileRows] = await Promise.all([
    fetchJsonArray(params.quoteUrl),
    fetchJsonArray(params.profileUrl),
  ]);

  const profilesByCode = new Map(
    profileRows.map((profile) => [getTaiwanStockCode(profile), profile]),
  );

  return quoteRows.flatMap((quoteRow): Array<TaiwanStockSearchResult & { searchText: string }> => {
    const code = getTaiwanStockCode(quoteRow);
    if (!code) {
      return [];
    }

    const profile = profilesByCode.get(code);
    const quoteName = getTaiwanStockName(quoteRow);
    const profileName = profile ? getTaiwanStockName(profile) : "";
    const englishAbbreviation = profile ? getTaiwanStockEnglishAbbreviation(profile) : "";
    const name = quoteName || profileName;
    if (!name) {
      return [];
    }

    const symbol = `${code}.${TAIWAN_PROVIDER_DISPLAY_SUFFIX[params.provider]}`;
    return [
      {
        name,
        symbol,
        sourceURL: params.quoteUrl,
        sourceId: `${params.sourcePrefix}:${code}`,
        searchText: [code, symbol, name, profileName, englishAbbreviation]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      },
    ];
  });
}

export async function fetchTaiwanListedStocksFromAPI(query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const [twseStocks, tpexStocks] = await Promise.all([
    loadTaiwanStockSearchData({
      provider: "twse",
      quoteUrl: TWSE_DAILY_CLOSE_URL,
      profileUrl: TWSE_PROFILE_URL,
      sourcePrefix: "TWSE",
    }),
    loadTaiwanStockSearchData({
      provider: "tpex",
      quoteUrl: TPEX_DAILY_CLOSE_URL,
      profileUrl: TPEX_PROFILE_URL,
      sourcePrefix: "TPEX",
    }),
  ]);

  return [...twseStocks, ...tpexStocks]
    .filter((stock) => stock.searchText.includes(normalizedQuery))
    .slice(0, 10)
    .map(({ searchText: _searchText, ...stock }) => stock);
}

export async function fetchQuoteForSource(source: QuoteSource): Promise<QuoteResult> {
  const fetchedAt = new Date();

  if (source.provider === "coinmarketcap") {
    return {
      ...source,
      price: await fetchCryptoPriceFromAPI(source.sourceKey),
      currency: "USD",
      fetchedAt,
    };
  }

  if (source.provider === "twse" || source.provider === "tpex") {
    return {
      ...source,
      price: await fetchTaiwanStockPriceFromAPI(source.provider, source.sourceKey),
      currency: "TWD",
      fetchedAt,
    };
  }

  return {
    ...source,
    price: await fetchListedStockPriceFromAPI(source.sourceKey),
    currency: "USD",
    fetchedAt,
  };
}
