import prisma from "./prisma";
import {
  Balance,
  BalanceCreateType,
  BalanceSchema,
  MonthlyRefreshOverview,
  ValueDataCreateSchema,
} from "./definitions";
import { getConvertedCurrency } from "./fx";
import { fetchQuoteForSource, getHoldingQuoteSource } from "./pricing";
import { firstDateOfMonth, getCalculatedMonth, getDatePartsInTimeZone } from "./utils";

export const MONTHLY_REFRESH_BATCH_SIZE = 5;
export const MONTHLY_REFRESH_DAILY_LIMIT = 50;
export const MONTHLY_REFRESH_FETCH_CONCURRENCY = 5;

type BalanceWithRelations = Balance;

function isRetryWindow(referenceDate: Date, targetMonth: Date) {
  const reference = getDatePartsInTimeZone(referenceDate);
  const target = getDatePartsInTimeZone(targetMonth);
  return (
    reference.year === target.year &&
    reference.month === target.month &&
    reference.day === target.day
  );
}

async function convertToValueData(balances: BalanceWithRelations[]) {
  const valueData: Record<string, any> = {};

  for (const balance of balances) {
    if (balance.holding?.category && balance.holding.type) {
      const {
        date,
        holding: { category, type },
        value,
        userId,
        currency,
      } = balance;
      const key = `${date.toISOString()}-${category.name}-${type.name}-${userId}`;

      if (!valueData[key]) {
        valueData[key] = {
          date,
          category,
          type,
          value: 0,
          userId,
          categoryId: category.id,
          typeId: type.id,
        };
      }

      if (currency === "USD") {
        valueData[key].value += value;
      } else {
        const addValue = await getConvertedCurrency(currency as any, "USD", value, date);
        valueData[key].value += addValue;
      }
    }
  }

  return Object.values(valueData);
}

function chunkEntries<T>(items: T[], size: number) {
  if (size <= 0) {
    return [items];
  }

  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export async function rebuildValueDataForMonth(userId: string, targetMonth: Date) {
  const balances = await prisma.balance.findMany({
    where: {
      userId,
      date: targetMonth,
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

  const parsedBalances = BalanceSchema.array().safeParse(balances);
  if (!parsedBalances.success) {
    throw new Error("Failed to parse balances while rebuilding monthly value data.");
  }

  await prisma.valueData.deleteMany({
    where: {
      userId,
      date: targetMonth,
    },
  });

  const valueDataArray = await convertToValueData(parsedBalances.data);
  const parsedValueData = ValueDataCreateSchema.array().safeParse(valueDataArray);
  if (!parsedValueData.success) {
    throw new Error("Failed to parse value data while rebuilding monthly value data.");
  }

  if (parsedValueData.data.length > 0) {
    await prisma.valueData.createMany({
      data: parsedValueData.data,
      skipDuplicates: true,
    });
  }
}

function getBalanceQuoteState(balance: BalanceWithRelations) {
  const source = getHoldingQuoteSource(balance.holding);
  return {
    source,
    priceStatus: source ? "pending" : "success",
  } as const;
}

export async function createMonthlyBalancesAndJob(params: {
  targetMonth: Date;
  userId: string;
  sourceBalances: BalanceWithRelations[];
  updateAccountingDate?: boolean;
}) {
  const targetMonth = firstDateOfMonth(params.targetMonth);
  const existingBalanceCount = await prisma.balance.count({
    where: {
      userId: params.userId,
      date: targetMonth,
    },
  });

  if (existingBalanceCount > 0) {
    return {
      created: false,
      targetMonth,
    };
  }

  const quoteSources = new Map<string, ReturnType<typeof getHoldingQuoteSource>>();
  const balancesToCreate: BalanceCreateType[] = params.sourceBalances.map((balance) => {
    const { holding, user, id, createdAt, updatedAt, ...balanceData } = balance;
    const { source, priceStatus } = getBalanceQuoteState(balance);

    if (source) {
      quoteSources.set(`${source.provider}:${source.sourceKey}`, source);
    }

    return {
      ...balanceData,
      date: targetMonth,
      value: balance.price * balance.quantity,
      priceStatus,
      priceFetchedAt: priceStatus === "success" ? new Date() : null,
      priceSource: source?.provider ?? "copied",
      priceError: null,
    };
  });

  const initialJobStatus = quoteSources.size > 0 ? "pending" : "completed";

  const result = await prisma.$transaction(async (tx) => {
    const createdBalances = await tx.balance.createManyAndReturn({
      data: balancesToCreate,
      include: {
        holding: {
          include: {
            category: true,
            type: true,
          },
        },
        user: true,
      },
    });

    const job = await tx.monthlyRefreshJob.upsert({
      where: {
        userId_targetMonth: {
          userId: params.userId,
          targetMonth,
        },
      },
      update: {
        status: initialJobStatus,
        startedAt: new Date(),
        completedAt: initialJobStatus === "completed" ? new Date() : null,
        errorSummary: null,
      },
      create: {
        userId: params.userId,
        targetMonth,
        status: initialJobStatus,
        startedAt: new Date(),
        completedAt: initialJobStatus === "completed" ? new Date() : null,
      },
    });

    if (quoteSources.size > 0) {
      await tx.assetPriceSnapshot.createMany({
        data: Array.from(quoteSources.values()).map((source) => ({
          targetMonth,
          provider: source!.provider,
          sourceKey: source!.sourceKey,
          status: "pending",
          userId: params.userId,
          jobId: job.id,
        })),
        skipDuplicates: true,
      });
    }

    if (params.updateAccountingDate !== false) {
      await tx.setting.update({
        where: {
          userId: params.userId,
        },
        data: {
          accountingDate: targetMonth,
        },
      });
    }

    return {
      createdBalances,
      job,
    };
  });

  await rebuildValueDataForMonth(params.userId, targetMonth);

  return {
    created: true,
    targetMonth,
    createdBalances: result.createdBalances,
    jobId: result.job.id,
  };
}

export async function autoCreateMonthlyRefreshJobs(referenceDate = new Date()) {
  const dateParts = getDatePartsInTimeZone(referenceDate);
  if (dateParts.day !== 1 || dateParts.hour !== 2) {
    return {
      createdUsers: [] as string[],
      targetMonth: firstDateOfMonth(referenceDate),
    };
  }

  const targetMonth = firstDateOfMonth(referenceDate);
  const previousMonth = firstDateOfMonth(getCalculatedMonth(referenceDate, -1));
  const settings = await prisma.setting.findMany({
    include: {
      user: true,
    },
  });

  const createdUsers: string[] = [];
  for (const setting of settings) {
    const existingBalanceCount = await prisma.balance.count({
      where: {
        userId: setting.userId,
        date: targetMonth,
      },
    });

    if (existingBalanceCount > 0) {
      continue;
    }

    const previousBalances = await prisma.balance.findMany({
      where: {
        userId: setting.userId,
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

    if (previousBalances.length === 0) {
      continue;
    }

    const parsedBalances = BalanceSchema.array().safeParse(previousBalances);
    if (!parsedBalances.success) {
      continue;
    }

    const result = await createMonthlyBalancesAndJob({
      targetMonth,
      userId: setting.userId,
      sourceBalances: parsedBalances.data,
    });

    if (result.created) {
      createdUsers.push(setting.userId);
    }
  }

  return {
    createdUsers,
    targetMonth,
  };
}

export async function fetchMonthlyRefreshOverview(userId: string, targetMonth: Date) {
  const normalizedMonth = firstDateOfMonth(targetMonth);
  const job = await prisma.monthlyRefreshJob.findUnique({
    where: {
      userId_targetMonth: {
        userId,
        targetMonth: normalizedMonth,
      },
    },
  });

  const grouped = await prisma.balance.groupBy({
    by: ["priceStatus"],
    where: {
      userId,
      date: normalizedMonth,
    },
    _count: {
      _all: true,
    },
  });

  const countMap = grouped.reduce<Record<string, number>>((acc, item) => {
    acc[item.priceStatus] = item._count._all;
    return acc;
  }, {});

  return {
    jobId: job?.id,
    status: job?.status ?? "idle",
    pendingCount: countMap.pending ?? 0,
    failedCount: countMap.failed ?? 0,
    estimatedCount: (countMap.pending ?? 0) + (countMap.failed ?? 0),
    completedCount: countMap.success ?? 0,
    targetMonth: normalizedMonth,
    updatedAt: job?.updatedAt,
  } satisfies MonthlyRefreshOverview;
}

function getBalanceSnapshotKey(balance: BalanceWithRelations) {
  const source = getHoldingQuoteSource(balance.holding);
  if (!source) return null;
  return {
    key: `${source.provider}:${source.sourceKey}`,
    source,
  };
}

async function applyQuoteFailure(params: {
  balanceIds: number[];
  jobId: number;
  userId: string;
  targetMonth: Date;
  provider: string;
  sourceKey: string;
  error: string;
}) {
  await prisma.assetPriceSnapshot.upsert({
    where: {
      userId_targetMonth_provider_sourceKey: {
        userId: params.userId,
        targetMonth: params.targetMonth,
        provider: params.provider,
        sourceKey: params.sourceKey,
      },
    },
    update: {
      status: "failed",
      error: params.error,
      fetchedAt: new Date(),
      jobId: params.jobId,
    },
    create: {
      userId: params.userId,
      targetMonth: params.targetMonth,
      provider: params.provider,
      sourceKey: params.sourceKey,
      status: "failed",
      error: params.error,
      fetchedAt: new Date(),
      jobId: params.jobId,
    },
  });

  await prisma.balance.updateMany({
    where: {
      id: {
        in: params.balanceIds,
      },
    },
    data: {
      priceStatus: "failed",
      priceError: params.error,
      priceFetchedAt: new Date(),
      priceSource: params.provider,
    },
  });
}

async function applyQuoteSuccess(params: {
  balanceIds: number[];
  jobId: number;
  userId: string;
  targetMonth: Date;
  provider: string;
  sourceKey: string;
  price: number;
  currency: string;
  fetchedAt: Date;
}) {
  await prisma.assetPriceSnapshot.upsert({
    where: {
      userId_targetMonth_provider_sourceKey: {
        userId: params.userId,
        targetMonth: params.targetMonth,
        provider: params.provider,
        sourceKey: params.sourceKey,
      },
    },
    update: {
      status: "success",
      price: params.price,
      currency: params.currency,
      fetchedAt: params.fetchedAt,
      error: null,
      jobId: params.jobId,
    },
    create: {
      userId: params.userId,
      targetMonth: params.targetMonth,
      provider: params.provider,
      sourceKey: params.sourceKey,
      status: "success",
      price: params.price,
      currency: params.currency,
      fetchedAt: params.fetchedAt,
      jobId: params.jobId,
    },
  });

  const balances = await prisma.balance.findMany({
    where: {
      id: {
        in: params.balanceIds,
      },
    },
    select: {
      id: true,
      quantity: true,
    },
  });

  for (const balance of balances) {
    await prisma.balance.update({
      where: {
        id: balance.id,
      },
      data: {
        price: params.price,
        value: params.price * balance.quantity,
        currency: params.currency,
        priceStatus: "success",
        priceFetchedAt: params.fetchedAt,
        priceSource: params.provider,
        priceError: null,
      },
    });
  }
}

export async function processMonthlyRefreshBatch(referenceDate = new Date(), limit = MONTHLY_REFRESH_BATCH_SIZE) {
  const job = await prisma.monthlyRefreshJob.findFirst({
    where: {
      status: {
        in: ["pending", "partial_complete"],
      },
    },
    orderBy: [
      { targetMonth: "asc" },
      { updatedAt: "asc" },
    ],
  });

  if (!job) {
    return {
      processedAssets: 0,
      status: "idle",
    };
  }

  await prisma.monthlyRefreshJob.update({
    where: {
      id: job.id,
    },
    data: {
      status: "running",
      startedAt: job.startedAt ?? new Date(),
      attemptCount: {
        increment: 1,
      },
      completedAt: null,
      errorSummary: null,
    },
  });

  const retryFailed = isRetryWindow(referenceDate, job.targetMonth);
  const candidateBalances = await prisma.balance.findMany({
    where: {
      userId: job.userId,
      date: job.targetMonth,
      priceStatus: {
        in: retryFailed ? ["pending", "failed"] : ["pending"],
      },
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

  const parsedBalances = BalanceSchema.array().safeParse(candidateBalances);
  if (!parsedBalances.success) {
    throw new Error("Failed to parse candidate balances for monthly refresh.");
  }

  const groupedBalances = new Map<string, { source: NonNullable<ReturnType<typeof getHoldingQuoteSource>>; balances: BalanceWithRelations[] }>();
  for (const balance of parsedBalances.data) {
    const sourceInfo = getBalanceSnapshotKey(balance);
    if (!sourceInfo) {
      continue;
    }

    const existing = groupedBalances.get(sourceInfo.key);
    if (existing) {
      existing.balances.push(balance);
    } else {
      groupedBalances.set(sourceInfo.key, {
        source: sourceInfo.source,
        balances: [balance],
      });
    }
  }

  const batchEntries = Array.from(groupedBalances.values()).slice(0, limit);

  for (const chunk of chunkEntries(batchEntries, MONTHLY_REFRESH_FETCH_CONCURRENCY)) {
    await Promise.all(
      chunk.map(async (entry) => {
        const balanceIds = entry.balances.map((balance) => balance.id);
        try {
          const quote = await fetchQuoteForSource(entry.source);
          await applyQuoteSuccess({
            balanceIds,
            jobId: job.id,
            userId: job.userId,
            targetMonth: job.targetMonth,
            provider: quote.provider,
            sourceKey: quote.sourceKey,
            price: quote.price,
            currency: quote.currency,
            fetchedAt: quote.fetchedAt,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown quote refresh error";
          await applyQuoteFailure({
            balanceIds,
            jobId: job.id,
            userId: job.userId,
            targetMonth: job.targetMonth,
            provider: entry.source.provider,
            sourceKey: entry.source.sourceKey,
            error: message,
          });
        }
      }),
    );
  }

  await rebuildValueDataForMonth(job.userId, job.targetMonth);

  const overview = await fetchMonthlyRefreshOverview(job.userId, job.targetMonth);
  let nextStatus: "pending" | "completed" | "partial_complete" = "pending";
  let completedAt: Date | null = null;
  let errorSummary: string | null = null;

  if (overview.pendingCount === 0 && overview.failedCount === 0) {
    nextStatus = "completed";
    completedAt = new Date();
  } else if (overview.pendingCount === 0 && overview.failedCount > 0 && !retryFailed) {
    nextStatus = "partial_complete";
    completedAt = new Date();
    errorSummary = `${overview.failedCount} asset price refreshes failed`;
  }

  await prisma.monthlyRefreshJob.update({
    where: {
      id: job.id,
    },
    data: {
      status: nextStatus,
      lastCursor: batchEntries.at(-1)?.source.sourceKey ?? job.lastCursor,
      completedAt,
      errorSummary,
    },
  });

  return {
    processedAssets: batchEntries.length,
    status: nextStatus,
    overview,
  };
}

export async function retryFailedMonthlyRefreshForMonth(userId: string, targetMonth: Date) {
  const normalizedMonth = firstDateOfMonth(targetMonth);
  await prisma.$transaction([
    prisma.balance.updateMany({
      where: {
        userId,
        date: normalizedMonth,
        priceStatus: "failed",
      },
      data: {
        priceStatus: "pending",
        priceError: null,
      },
    }),
    prisma.assetPriceSnapshot.updateMany({
      where: {
        userId,
        targetMonth: normalizedMonth,
        status: "failed",
      },
      data: {
        status: "pending",
        error: null,
      },
    }),
    prisma.monthlyRefreshJob.updateMany({
      where: {
        userId,
        targetMonth: normalizedMonth,
      },
      data: {
        status: "pending",
        completedAt: null,
        errorSummary: null,
      },
    }),
  ]);
}
