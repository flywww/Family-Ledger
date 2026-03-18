import { NextRequest, NextResponse } from "next/server";
import {
  autoCreateMonthlyRefreshJobs,
  createCronRunLog,
  getRefreshLogMessage,
  MONTHLY_REFRESH_DAILY_LIMIT,
  processMonthlyRefreshBatch,
} from "@/lib/monthly-refresh";

export const maxDuration = 60;

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${cronSecret}`;
}

async function handleCron(request: NextRequest) {
  const requestStartedAt = Date.now();
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const referenceDate = new Date();
  const created = await autoCreateMonthlyRefreshJobs(referenceDate);
  const configuredLimit = Number.parseInt(
    process.env.MONTHLY_REFRESH_DAILY_LIMIT ?? `${MONTHLY_REFRESH_DAILY_LIMIT}`,
    10,
  );
  const processed = await processMonthlyRefreshBatch(
    referenceDate,
    Number.isFinite(configuredLimit) && configuredLimit > 0
      ? configuredLimit
      : MONTHLY_REFRESH_DAILY_LIMIT,
  );
  const triggerType =
    request.headers.get("x-cron-trigger") === "manual_test"
      ? "manual_test"
      : "scheduled";
  const finishedAt = new Date();
  if (processed.userId && processed.targetMonth) {
    await createCronRunLog({
      userId: processed.userId,
      targetMonth: processed.targetMonth,
      triggerType,
      status: processed.status,
      message: getRefreshLogMessage({
        status: processed.status,
        processedAssets: processed.processedAssets,
        overview: processed.overview,
      }),
      processedAssets: processed.processedAssets,
      providerCounts: processed.providerCounts,
      startedAt: new Date(requestStartedAt),
      finishedAt,
      jobId: processed.jobId,
    });
  }

  const durationMs = Date.now() - requestStartedAt;
  console.log(
    JSON.stringify({
      event: "monthly-refresh-cron",
      createdUsers: created.createdUsers,
      targetMonth: created.targetMonth.toISOString(),
      processedAssets: processed.processedAssets,
      providerCounts: processed.providerCounts,
      status: processed.status,
      overview: processed.overview
        ? {
            pendingCount: processed.overview.pendingCount,
            failedCount: processed.overview.failedCount,
            completedCount: processed.overview.completedCount,
            estimatedCount: processed.overview.estimatedCount,
            targetMonth: processed.overview.targetMonth.toISOString(),
            updatedAt: processed.overview.updatedAt?.toISOString(),
          }
        : null,
      durationMs,
    }),
  );

  return NextResponse.json({
    ok: true,
    createdUsers: created.createdUsers,
    targetMonth: created.targetMonth,
    processedAssets: processed.processedAssets,
    providerCounts: processed.providerCounts,
    status: processed.status,
    overview: processed.overview,
    durationMs,
  });
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}
