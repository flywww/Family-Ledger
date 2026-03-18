import { categoryListType, Holding } from "./definitions";

export type QuoteProvider = "coinmarketcap" | "financialmodelingprep";

export type QuoteSource = {
  provider: QuoteProvider;
  sourceKey: string;
};

export type QuoteResult = QuoteSource & {
  price: number;
  currency: "USD";
  fetchedAt: Date;
};

export const CMC_IDS_PER_CALL = 8;

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
    return {
      provider: "financialmodelingprep",
      sourceKey: holding.sourceId.toString(),
    };
  }

  return null;
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

  return {
    ...source,
    price: await fetchListedStockPriceFromAPI(source.sourceKey),
    currency: "USD",
    fetchedAt,
  };
}
