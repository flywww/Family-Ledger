import prisma from "../lib/prisma";
import { vi, beforeEach, afterAll, describe, expect, it } from "vitest";

const { fetchQuoteForSourceMock, fetchCryptoQuotesBatchFromAPIMock } = vi.hoisted(() => ({
  fetchQuoteForSourceMock: vi.fn(),
  fetchCryptoQuotesBatchFromAPIMock: vi.fn(),
}));
const TEST_TIMEOUT_MS = 15_000;

vi.mock("../lib/pricing", async () => {
  const actual = await vi.importActual<typeof import("../lib/pricing")>("../lib/pricing");
  return {
    ...actual,
    fetchCryptoQuotesBatchFromAPI: fetchCryptoQuotesBatchFromAPIMock,
    fetchQuoteForSource: fetchQuoteForSourceMock,
  };
});

import {
  autoCreateMonthlyRefreshJobs,
  createMonthlyBalancesAndJob,
  fetchMonthlyRefreshOverview,
  prepareNextMonthBalancesFromSourceMonth,
  processMonthlyRefreshBatch,
  retryFailedMonthlyRefreshForMonth,
  runRateLimitedTasks,
} from "../lib/monthly-refresh";

async function resetDatabase() {
  await prisma.cronRunLog.deleteMany();
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

async function seedManyCryptoSourceData(count: number) {
  const user = await prisma.user.create({
    data: {
      account: "bulk-tester",
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

  await prisma.setting.create({
    data: {
      userId: user.id,
      accountingDate: new Date("2026-03-01T00:00:00+08:00"),
      displayCurrency: "USD",
      displayCategories: "Cryptocurrency",
    },
  });

  const previousMonth = new Date("2026-03-01T00:00:00+08:00");
  for (let index = 0; index < count; index += 1) {
    const holding = await prisma.holding.create({
      data: {
        name: `Crypto ${index}`,
        symbol: `C${index}`,
        typeId: assetType.id,
        categoryId: cryptoCategory.id,
        userId: user.id,
        sourceId: `crypto-${index}`,
        sourceURL: "coinmarketcap",
      },
    });

    await prisma.balance.create({
      data: {
        userId: user.id,
        holdingId: holding.id,
        date: previousMonth,
        quantity: 1,
        price: 100 + index,
        value: 100 + index,
        currency: "USD",
        note: "",
        priceStatus: "success",
        priceFetchedAt: new Date("2026-03-01T02:00:00+08:00"),
        priceSource: "seed",
      },
    });
  }

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
  fetchCryptoQuotesBatchFromAPIMock.mockReset();
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("monthly refresh workflow", () => {
  it("limits request starts within the configured minute window", async () => {
    let now = 0;
    const startedAt: number[] = [];

    await runRateLimitedTasks(
      Array.from({ length: 50 }, (_, index) => index),
      {
        concurrency: 5,
        maxStartsPerMinute: 25,
        now: () => now,
        sleep: async (ms) => {
          now += ms;
        },
        onStart: (_, startedAtMs) => {
          startedAt.push(startedAtMs);
        },
        task: async () => {},
      },
    );

    expect(startedAt).toHaveLength(50);

    for (let index = 0; index < startedAt.length; index += 1) {
      const windowStart = startedAt[index];
      const startsInWindow = startedAt.filter(
        (startedAtMs) => startedAtMs >= windowStart && startedAtMs < windowStart + 60_000,
      ).length;
      expect(startsInWindow).toBeLessThanOrEqual(25);
    }
  });

  it("auto-creates the new month and refresh job without fetching quotes inline", async () => {
    const { user } = await seedMonthlySourceData();

    const result = await autoCreateMonthlyRefreshJobs(new Date("2026-04-01T02:05:00+08:00"));

    expect(result.createdUsers).toEqual([user.id]);
    expect(fetchQuoteForSourceMock).not.toHaveBeenCalled();
    expect(fetchCryptoQuotesBatchFromAPIMock).not.toHaveBeenCalled();

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
  }, 40_000);

  it("deduplicates provider fetches, retries failed quotes, and completes the job", async () => {
    const { user, nextMonth, sourceBalances } = await seedMonthlySourceData();

    await createMonthlyBalancesAndJob({
      targetMonth: nextMonth,
      userId: user.id,
      sourceBalances: sourceBalances as any,
    });

    fetchCryptoQuotesBatchFromAPIMock.mockResolvedValue({
      "btc-1": {
        quote: {
          USD: {
            price: 91000,
          },
        },
      },
    });
    fetchQuoteForSourceMock.mockImplementation(async (source) => {
      throw new Error("FMP unavailable");
    });

    const firstBatch = await processMonthlyRefreshBatch(
      new Date("2026-04-01T02:15:00+08:00"),
      5,
    );

    expect(firstBatch.processedAssets).toBe(2);
    expect(fetchCryptoQuotesBatchFromAPIMock).toHaveBeenCalledTimes(1);
    expect(fetchQuoteForSourceMock).toHaveBeenCalledTimes(1);

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
  }, 40_000);

  it("marks test-created records and processes 50 crypto assets in one invocation", async () => {
    const { user, nextMonth, sourceBalances } = await seedManyCryptoSourceData(50);
    const previousRateLimit = process.env.CMC_REQUESTS_PER_MINUTE;
    process.env.CMC_REQUESTS_PER_MINUTE = "100";

    await createMonthlyBalancesAndJob({
      targetMonth: nextMonth,
      userId: user.id,
      sourceBalances: sourceBalances as any,
      isTestData: true,
    });

    const createdBalances = await prisma.balance.findMany({
      where: {
        userId: user.id,
        date: nextMonth,
      },
    });
    expect(createdBalances).toHaveLength(50);
    expect(createdBalances.every((balance) => balance.isTestData)).toBe(true);

    const createdJob = await prisma.monthlyRefreshJob.findUnique({
      where: {
        userId_targetMonth: {
          userId: user.id,
          targetMonth: nextMonth,
        },
      },
    });
    expect(createdJob?.isTestData).toBe(true);

    const createdValueData = await prisma.valueData.findMany({
      where: {
        userId: user.id,
        date: nextMonth,
      },
    });
    expect(createdValueData.every((item) => item.isTestData)).toBe(true);

    fetchCryptoQuotesBatchFromAPIMock.mockImplementation(async (ids: string[]) =>
      Object.fromEntries(
        ids.map((id) => [
          id,
          {
            quote: {
              USD: {
                price: 777,
              },
            },
          },
        ]),
      ),
    );

    const batch = await processMonthlyRefreshBatch(
      new Date("2026-04-01T02:10:00+08:00"),
      50,
      {
        userId: user.id,
        targetMonth: nextMonth,
      },
    );

    expect(batch.processedAssets).toBe(50);
    expect(batch.providerCounts.coinmarketcap).toBe(50);
    expect(batch.status).toBe("completed");
    expect(fetchCryptoQuotesBatchFromAPIMock).toHaveBeenCalledTimes(7);
    expect(fetchQuoteForSourceMock).not.toHaveBeenCalled();

    const refreshedJob = await prisma.monthlyRefreshJob.findUnique({
      where: {
        userId_targetMonth: {
          userId: user.id,
          targetMonth: nextMonth,
        },
      },
    });
    expect(refreshedJob?.lastProcessedAssets).toBe(50);
    expect(refreshedJob?.lastDurationMs).toBeTypeOf("number");
    expect(refreshedJob?.lastRunAt).toBeTruthy();

    const refreshedSnapshots = await prisma.assetPriceSnapshot.findMany({
      where: {
        userId: user.id,
        targetMonth: nextMonth,
      },
    });
    expect(refreshedSnapshots).toHaveLength(50);
    expect(refreshedSnapshots.every((snapshot) => snapshot.isTestData)).toBe(true);

    if (previousRateLimit === undefined) {
      delete process.env.CMC_REQUESTS_PER_MINUTE;
    } else {
      process.env.CMC_REQUESTS_PER_MINUTE = previousRateLimit;
    }
  }, 40_000);

  it("prepares next month balances manually and leaves price refresh pending for cron", async () => {
    const { user, previousMonth } = await seedMonthlySourceData();

    const result = await prepareNextMonthBalancesFromSourceMonth({
      userId: user.id,
      sourceMonth: previousMonth,
    });

    expect(result.created).toBe(true);
    expect(result.targetMonth.toISOString()).toBe(new Date("2026-04-01T00:00:00+08:00").toISOString());

    const setting = await prisma.setting.findUnique({
      where: {
        userId: user.id,
      },
    });
    expect(setting?.accountingDate.toISOString()).toBe(result.targetMonth.toISOString());

    const aprilBalances = await prisma.balance.findMany({
      where: {
        userId: user.id,
        date: result.targetMonth,
      },
      orderBy: {
        id: "asc",
      },
    });
    expect(aprilBalances).toHaveLength(3);
    expect(aprilBalances.filter((balance) => balance.priceStatus === "pending")).toHaveLength(3);

    const aprilJob = await prisma.monthlyRefreshJob.findUnique({
      where: {
        userId_targetMonth: {
          userId: user.id,
          targetMonth: result.targetMonth,
        },
      },
    });
    expect(aprilJob?.status).toBe("pending");
  });

  it("prepares the correct month when the source month arrives from a UTC-serialized query string", async () => {
    const { user } = await seedMonthlySourceData();

    const serializedMonthMarker = new Date("2026-02-28T16:00:00.000Z");
    const result = await prepareNextMonthBalancesFromSourceMonth({
      userId: user.id,
      sourceMonth: serializedMonthMarker,
    });

    expect(result.created).toBe(true);
    expect(result.sourceMonth.toISOString()).toBe(new Date("2026-03-01T00:00:00+08:00").toISOString());
    expect(result.targetMonth.toISOString()).toBe(new Date("2026-04-01T00:00:00+08:00").toISOString());

    const aprilBalances = await prisma.balance.findMany({
      where: {
        userId: user.id,
        date: result.targetMonth,
      },
    });
    expect(aprilBalances).toHaveLength(3);
  });
});
