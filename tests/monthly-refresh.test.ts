import prisma from "../lib/prisma";
import { vi, beforeEach, afterAll, describe, expect, it } from "vitest";

const { fetchQuoteForSourceMock } = vi.hoisted(() => ({
  fetchQuoteForSourceMock: vi.fn(),
}));
const TEST_TIMEOUT_MS = 15_000;

vi.mock("../lib/pricing", async () => {
  const actual = await vi.importActual<typeof import("../lib/pricing")>("../lib/pricing");
  return {
    ...actual,
    fetchQuoteForSource: fetchQuoteForSourceMock,
  };
});

import {
  autoCreateMonthlyRefreshJobs,
  createMonthlyBalancesAndJob,
  fetchMonthlyRefreshOverview,
  processMonthlyRefreshBatch,
  retryFailedMonthlyRefreshForMonth,
} from "../lib/monthly-refresh";

async function resetDatabase() {
  await prisma.assetPriceSnapshot.deleteMany();
  await prisma.monthlyRefreshJob.deleteMany();
  await prisma.valueData.deleteMany();
  await prisma.balance.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.category.deleteMany();
  await prisma.type.deleteMany();
  await prisma.user.deleteMany();
}

async function seedMonthlySourceData() {
  const user = await prisma.user.create({
    data: {
      account: "tester",
      password: "password123",
    },
  });

  const assetType = await prisma.type.create({
    data: {
      name: "Assets",
    },
  });

  const cryptoCategory = await prisma.category.create({
    data: {
      name: "Cryptocurrency",
      isHide: false,
    },
  });

  const stockCategory = await prisma.category.create({
    data: {
      name: "Listed stock",
      isHide: false,
    },
  });

  await prisma.setting.create({
    data: {
      userId: user.id,
      accountingDate: new Date("2026-03-01T00:00:00+08:00"),
      displayCurrency: "USD",
      displayCategories: "Cryptocurrency,Listed stock",
    },
  });

  const btcHolding = await prisma.holding.create({
    data: {
      name: "Bitcoin",
      symbol: "BTC",
      typeId: assetType.id,
      categoryId: cryptoCategory.id,
      userId: user.id,
      sourceId: "btc-1",
      sourceURL: "coinmarketcap",
    },
  });

  const btcWalletHolding = await prisma.holding.create({
    data: {
      name: "Bitcoin Wallet",
      symbol: "BTC",
      typeId: assetType.id,
      categoryId: cryptoCategory.id,
      userId: user.id,
      sourceId: "btc-1",
      sourceURL: "coinmarketcap",
    },
  });

  const tslaHolding = await prisma.holding.create({
    data: {
      name: "Tesla",
      symbol: "TSLA",
      typeId: assetType.id,
      categoryId: stockCategory.id,
      userId: user.id,
      sourceId: "TSLA",
      sourceURL: "fmp",
    },
  });

  const previousMonth = new Date("2026-03-01T00:00:00+08:00");
  await prisma.balance.createMany({
    data: [
      {
        userId: user.id,
        holdingId: btcHolding.id,
        date: previousMonth,
        quantity: 1,
        price: 80000,
        value: 80000,
        currency: "USD",
        note: "",
        priceStatus: "success",
        priceFetchedAt: new Date("2026-03-01T02:00:00+08:00"),
        priceSource: "seed",
      },
      {
        userId: user.id,
        holdingId: btcWalletHolding.id,
        date: previousMonth,
        quantity: 0.5,
        price: 80000,
        value: 40000,
        currency: "USD",
        note: "",
        priceStatus: "success",
        priceFetchedAt: new Date("2026-03-01T02:00:00+08:00"),
        priceSource: "seed",
      },
      {
        userId: user.id,
        holdingId: tslaHolding.id,
        date: previousMonth,
        quantity: 10,
        price: 200,
        value: 2000,
        currency: "USD",
        note: "",
        priceStatus: "success",
        priceFetchedAt: new Date("2026-03-01T02:00:00+08:00"),
        priceSource: "seed",
      },
    ],
  });

  const sourceBalances = await prisma.balance.findMany({
    where: {
      userId: user.id,
      date: previousMonth,
    },
    include: {
      holding: {
        include: {
          category: true,
          type: true,
        },
      },
      user: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  return {
    user,
    previousMonth,
    nextMonth: new Date("2026-04-01T00:00:00+08:00"),
    sourceBalances,
  };
}

beforeEach(async () => {
  fetchQuoteForSourceMock.mockReset();
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("monthly refresh workflow", () => {
  it("auto-creates the new month and refresh job without fetching quotes inline", async () => {
    const { user } = await seedMonthlySourceData();

    const result = await autoCreateMonthlyRefreshJobs(new Date("2026-04-01T02:05:00+08:00"));

    expect(result.createdUsers).toEqual([user.id]);
    expect(fetchQuoteForSourceMock).not.toHaveBeenCalled();

    const aprilBalances = await prisma.balance.findMany({
      where: {
        userId: user.id,
        date: new Date("2026-04-01T00:00:00+08:00"),
      },
      orderBy: {
        id: "asc",
      },
    });

    expect(aprilBalances).toHaveLength(3);
    expect(aprilBalances.every((balance) => balance.priceStatus === "pending")).toBe(true);

    const job = await prisma.monthlyRefreshJob.findUnique({
      where: {
        userId_targetMonth: {
          userId: user.id,
          targetMonth: new Date("2026-04-01T00:00:00+08:00"),
        },
      },
    });

    expect(job?.status).toBe("pending");
  }, TEST_TIMEOUT_MS);

  it("deduplicates provider fetches, retries failed quotes, and completes the job", async () => {
    const { user, nextMonth, sourceBalances } = await seedMonthlySourceData();

    await createMonthlyBalancesAndJob({
      targetMonth: nextMonth,
      userId: user.id,
      sourceBalances: sourceBalances as any,
    });

    fetchQuoteForSourceMock.mockImplementation(async (source) => {
      if (source.provider === "coinmarketcap") {
        return {
          ...source,
          price: 91000,
          currency: "USD",
          fetchedAt: new Date("2026-04-01T02:15:00+08:00"),
        };
      }

      throw new Error("FMP unavailable");
    });

    const firstBatch = await processMonthlyRefreshBatch(
      new Date("2026-04-01T02:15:00+08:00"),
      5,
    );

    expect(firstBatch.processedAssets).toBe(2);
    expect(fetchQuoteForSourceMock).toHaveBeenCalledTimes(2);

    const firstOverview = await fetchMonthlyRefreshOverview(user.id, nextMonth);
    expect(firstOverview.completedCount).toBe(2);
    expect(firstOverview.failedCount).toBe(1);
    expect(firstOverview.status).toBe("pending");

    const btcBalances = await prisma.balance.findMany({
      where: {
        userId: user.id,
        date: nextMonth,
        holding: {
          sourceId: "btc-1",
        },
      },
    });
    expect(btcBalances).toHaveLength(2);
    expect(btcBalances.every((balance) => balance.price === 91000)).toBe(true);
    expect(btcBalances.every((balance) => balance.priceStatus === "success")).toBe(true);

    const failedStock = await prisma.balance.findFirst({
      where: {
        userId: user.id,
        date: nextMonth,
        holding: {
          sourceId: "TSLA",
        },
      },
    });
    expect(failedStock?.priceStatus).toBe("failed");
    expect(failedStock?.priceError).toContain("FMP unavailable");

    await retryFailedMonthlyRefreshForMonth(user.id, nextMonth);

    fetchQuoteForSourceMock.mockImplementation(async (source) => ({
      ...source,
      price: 245,
      currency: "USD",
      fetchedAt: new Date("2026-04-01T02:30:00+08:00"),
    }));

    const secondBatch = await processMonthlyRefreshBatch(
      new Date("2026-04-01T02:30:00+08:00"),
      5,
    );

    expect(secondBatch.processedAssets).toBe(1);

    const finalOverview = await fetchMonthlyRefreshOverview(user.id, nextMonth);
    expect(finalOverview.status).toBe("completed");
    expect(finalOverview.failedCount).toBe(0);
    expect(finalOverview.pendingCount).toBe(0);

    const finalStock = await prisma.balance.findFirst({
      where: {
        userId: user.id,
        date: nextMonth,
        holding: {
          sourceId: "TSLA",
        },
      },
    });
    expect(finalStock?.price).toBe(245);
    expect(finalStock?.priceStatus).toBe("success");
  }, TEST_TIMEOUT_MS);
});
