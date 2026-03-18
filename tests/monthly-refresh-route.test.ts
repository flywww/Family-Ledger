import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const monthlyRefreshMocks = vi.hoisted(() => ({
  autoCreateMonthlyRefreshJobsMock: vi.fn(),
  createCronRunLogMock: vi.fn(),
  getRefreshLogMessageMock: vi.fn(),
  processMonthlyRefreshBatchMock: vi.fn(),
}));

vi.mock("../lib/monthly-refresh", () => ({
  MONTHLY_REFRESH_DAILY_LIMIT: 50,
  autoCreateMonthlyRefreshJobs: monthlyRefreshMocks.autoCreateMonthlyRefreshJobsMock,
  createCronRunLog: monthlyRefreshMocks.createCronRunLogMock,
  getRefreshLogMessage: monthlyRefreshMocks.getRefreshLogMessageMock,
  processMonthlyRefreshBatch: monthlyRefreshMocks.processMonthlyRefreshBatchMock,
}));

import { GET, POST, maxDuration } from "../app/api/cron/monthly-refresh/route";

describe("monthly refresh cron route", () => {
  beforeEach(() => {
    monthlyRefreshMocks.autoCreateMonthlyRefreshJobsMock.mockReset();
    monthlyRefreshMocks.createCronRunLogMock.mockReset();
    monthlyRefreshMocks.getRefreshLogMessageMock.mockReset();
    monthlyRefreshMocks.processMonthlyRefreshBatchMock.mockReset();
    process.env.CRON_SECRET = "secret";
    monthlyRefreshMocks.getRefreshLogMessageMock.mockReturnValue("Processed 2 asset sources.");
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("rejects unauthorized requests", async () => {
    const request = new NextRequest("https://example.com/api/cron/monthly-refresh");
    const response = await GET(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns structured cron results for authorized requests", async () => {
    monthlyRefreshMocks.autoCreateMonthlyRefreshJobsMock.mockResolvedValue({
      createdUsers: ["user-1"],
      targetMonth: new Date("2026-04-01T00:00:00.000Z"),
    });
    monthlyRefreshMocks.processMonthlyRefreshBatchMock.mockResolvedValue({
      processedAssets: 2,
      providerCounts: {
        coinmarketcap: 1,
        financialmodelingprep: 1,
      },
      status: "completed",
      userId: "user-1",
      targetMonth: new Date("2026-04-01T00:00:00.000Z"),
      jobId: 42,
      overview: {
        status: "completed",
        pendingCount: 0,
        failedCount: 0,
        estimatedCount: 0,
        completedCount: 2,
        targetMonth: new Date("2026-04-01T00:00:00.000Z"),
      },
      durationMs: 321,
    });

    const request = new NextRequest("https://example.com/api/cron/monthly-refresh", {
      method: "POST",
      headers: {
        authorization: "Bearer secret",
        "x-cron-trigger": "manual_test",
      },
    });
    const response = await POST(request);
    const json = await response.json();

    expect(maxDuration).toBe(60);
    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.createdUsers).toEqual(["user-1"]);
    expect(json.processedAssets).toBe(2);
    expect(json.providerCounts).toEqual({
      coinmarketcap: 1,
      financialmodelingprep: 1,
    });
    expect(json.status).toBe("completed");
    expect(json.durationMs).toBeTypeOf("number");
    expect(monthlyRefreshMocks.createCronRunLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        triggerType: "manual_test",
        status: "completed",
        jobId: 42,
      }),
    );
  });
});
