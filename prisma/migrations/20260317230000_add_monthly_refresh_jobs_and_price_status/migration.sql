-- CreateEnum
CREATE TYPE "PriceStatus" AS ENUM ('pending', 'success', 'failed');

-- CreateEnum
CREATE TYPE "RefreshJobStatus" AS ENUM ('pending', 'running', 'partial_complete', 'completed', 'failed');

-- AlterTable
ALTER TABLE "Balance"
ADD COLUMN     "priceError" TEXT,
ADD COLUMN     "priceFetchedAt" TIMESTAMP(3),
ADD COLUMN     "priceSource" TEXT,
ADD COLUMN     "priceStatus" "PriceStatus" NOT NULL DEFAULT 'success';

-- CreateTable
CREATE TABLE "MonthlyRefreshJob" (
    "id" SERIAL NOT NULL,
    "targetMonth" TIMESTAMP(3) NOT NULL,
    "status" "RefreshJobStatus" NOT NULL DEFAULT 'pending',
    "lastCursor" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorSummary" TEXT,
    "userId" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyRefreshJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetPriceSnapshot" (
    "id" SERIAL NOT NULL,
    "targetMonth" TIMESTAMP(3) NOT NULL,
    "provider" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "currency" TEXT,
    "fetchedAt" TIMESTAMP(3),
    "status" "PriceStatus" NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "userId" VARCHAR(30) NOT NULL,
    "jobId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetPriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyRefreshJob_userId_targetMonth_key" ON "MonthlyRefreshJob"("userId", "targetMonth");

-- CreateIndex
CREATE UNIQUE INDEX "AssetPriceSnapshot_userId_targetMonth_provider_sourceKey_key" ON "AssetPriceSnapshot"("userId", "targetMonth", "provider", "sourceKey");

-- AddForeignKey
ALTER TABLE "MonthlyRefreshJob" ADD CONSTRAINT "MonthlyRefreshJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetPriceSnapshot" ADD CONSTRAINT "AssetPriceSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetPriceSnapshot" ADD CONSTRAINT "AssetPriceSnapshot_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "MonthlyRefreshJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
