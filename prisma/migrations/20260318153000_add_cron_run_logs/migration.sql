CREATE TYPE "CronRunTriggerType" AS ENUM ('scheduled', 'manual_test', 'manual_create');

CREATE TYPE "CronRunStatus" AS ENUM ('idle', 'pending', 'running', 'partial_complete', 'completed', 'failed');

CREATE TABLE "CronRunLog" (
    "id" SERIAL NOT NULL,
    "targetMonth" TIMESTAMP(3) NOT NULL,
    "triggerType" "CronRunTriggerType" NOT NULL,
    "status" "CronRunStatus" NOT NULL,
    "processedAssets" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT NOT NULL,
    "providerCounts" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "userId" VARCHAR(30) NOT NULL,
    "jobId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CronRunLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CronRunLog" ADD CONSTRAINT "CronRunLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CronRunLog" ADD CONSTRAINT "CronRunLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "MonthlyRefreshJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "CronRunLog_userId_startedAt_idx" ON "CronRunLog"("userId", "startedAt" DESC);
