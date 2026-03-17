import { NextRequest, NextResponse } from "next/server";
import {
  autoCreateMonthlyRefreshJobs,
  processMonthlyRefreshBatch,
} from "@/lib/monthly-refresh";

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${cronSecret}`;
}

async function handleCron(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const referenceDate = new Date();
  const created = await autoCreateMonthlyRefreshJobs(referenceDate);
  const processed = await processMonthlyRefreshBatch(referenceDate);

  return NextResponse.json({
    ok: true,
    createdUsers: created.createdUsers,
    targetMonth: created.targetMonth,
    processed,
  });
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}
