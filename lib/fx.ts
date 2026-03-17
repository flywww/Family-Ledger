import prisma from "./prisma";
import {
  CurrencyExchangeRateCreateType,
  currencySymbols,
  currencyType,
} from "./definitions";
import { getUTCDateString } from "./utils";

let usdExchangeRateCache = new Map<string, number>();

export function resetFxCache() {
  usdExchangeRateCache = new Map<string, number>();
}

export async function fetchCurrencyExchangeRates(date: Date) {
  try {
    const isHistoricalData =
      date <
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const API_KEY = process.env.CURRENCYAPI_API_KEY;
    if (!API_KEY) {
      throw new Error("Currency exchange API key is missing");
    }

    const header = { headers: { apikey: API_KEY } };
    const apiUrl = `https://api.currencyapi.com/v3/${isHistoricalData ? "historical" : "latest"}?`;
    const currencies = currencySymbols.join("%2C");
    const queryURL = isHistoricalData
      ? `${apiUrl}currencies=${currencies}&date=${getUTCDateString(date)}`
      : `${apiUrl}currencies=${currencies}`;
    const response = await fetch(queryURL, header);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Currency API ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const currencyData: CurrencyExchangeRateCreateType[] = Object.values(result.data).map(
      (data: any) => ({
        currency: data.code,
        rate: data.value,
        date,
      }),
    );

    return currencyData;
  } catch (error) {
    console.log(`Fail to fetch currency exchange rates: ${error}`);
    return [];
  }
}

export async function getConvertedCurrency(
  fromCurrency: currencyType,
  toCurrency: currencyType,
  amount: number,
  date: Date,
) {
  try {
    if (fromCurrency === toCurrency) return amount;

    let fromCurrencyRate;
    let toCurrencyRate;
    const dateKey = date.toISOString().split("T")[0];
    const fromCacheKey = `${fromCurrency}-${dateKey}`;
    const toCacheKey = `${toCurrency}-${dateKey}`;

    if (usdExchangeRateCache.has(fromCacheKey) && usdExchangeRateCache.has(toCacheKey)) {
      fromCurrencyRate = usdExchangeRateCache.get(fromCacheKey);
      toCurrencyRate = usdExchangeRateCache.get(toCacheKey);
      if (fromCurrencyRate !== undefined && toCurrencyRate !== undefined) {
        return (amount * toCurrencyRate) / fromCurrencyRate;
      }
    }

    let rateData = await prisma.currencyExchangeRate.findMany({
      where: {
        OR: [
          { date, currency: fromCurrency },
          { date, currency: toCurrency },
        ],
      },
    });

    if (rateData.length < 2) {
      const currencyData = await fetchCurrencyExchangeRates(date);
      if (currencyData.length > 0) {
        await prisma.currencyExchangeRate.createMany({
          data: currencyData,
          skipDuplicates: true,
        });
        rateData = await prisma.currencyExchangeRate.findMany({
          where: {
            OR: [
              { date, currency: fromCurrency },
              { date, currency: toCurrency },
            ],
          },
        });
      }
    }

    fromCurrencyRate = rateData.find((data) => data.currency === fromCurrency)?.rate;
    toCurrencyRate = rateData.find((data) => data.currency === toCurrency)?.rate;

    if (fromCurrencyRate !== undefined) {
      usdExchangeRateCache.set(fromCacheKey, fromCurrencyRate);
    }
    if (toCurrencyRate !== undefined) {
      usdExchangeRateCache.set(toCacheKey, toCurrencyRate);
    }

    if (fromCurrencyRate !== undefined && toCurrencyRate !== undefined) {
      return (amount * toCurrencyRate) / fromCurrencyRate;
    }

    return -1;
  } catch (error) {
    console.log(`Fail to get converted currency: ${error}`);
    return -1;
  }
}
