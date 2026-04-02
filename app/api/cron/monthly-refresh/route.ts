import { NextRequest, NextResponse } from "next/server";
import {
  isLegacyMonthlyRefreshWindow,
  autoCreateMonthlyRefreshJobs,
  createCronRunLog,
  getRefreshLogMessage,
  MONTHLY_REFRESH_DAILY_LIMIT,
  processMonthlyRefreshBatch,
} from "@/lib/monthly-refresh";
import { APP_TIME_ZONE, firstDateOfMonth } from "@/lib/utils";

export const maxDuration = 60;

function logCronEvent(event: string, payload: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      event,
      ...payload,
    }),
  );
}

function getAuthorizationState(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return {
      ok: false,
      reason: "missing_secret" as const,
    };
  }

  const authorization = request.headers.get("authorization");
  return {
    ok: authorization === `Bearer ${cronSecret}`,
    reason: authorization === `Bearer ${cronSecret}` ? "authorized" as const : "invalid_authorization" as const,
  };
}

async function handleCron(request: NextRequest) {
  const requestStartedAt = Date.now();
  const referenceDate = new Date();
  const triggerType =
    request.headers.get("x-cron-trigger") === "manual_test"
      ? "manual_test"
      : "scheduled";
  const authorization = getAuthorizationState(request);

  logCronEvent("monthly-refresh-cron-start", {
    triggerType,
    requestStartedAt: new Date(requestStartedAt).toISOString(),
    referenceDate: referenceDate.toISOString(),
    targetMonth: firstDateOfMonth(referenceDate).toISOString(),
    appTimeZone: APP_TIME_ZONE,
    legacyMonthlyWindow: isLegacyMonthlyRefreshWindow(referenceDate),
    configuredDailyLimit:
      process.env.MONTHLY_REFRESH_DAILY_LIMIT ?? `${MONTHLY_REFRESH_DAILY_LIMIT}`,
    hasCronSecret: Boolean(process.env.CRON_SECRET),
  });

  if (!authorization.ok) {
    const status = authorization.reason === "missing_secret" ? 500 : 401;
    logCronEvent("monthly-refresh-cron-rejected", {
      triggerType,
      reason: authorization.reason,
      hasAuthorizationHeader: Boolean(request.headers.get("authorization")),
      status,
    });

    if (authorization.reason === "missing_secret") {
      return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  logCronEvent("monthly-refresh-cron", {
    triggerType,
    createdUsers: created.createdUsers,
    createdMonthsByUser: created.createdMonthsByUser,
    targetMonth: created.targetMonth.toISOString(),
    appTimeZone: created.timeZone,
    legacyMonthlyWindow: created.legacyWindow,
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
  });

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
