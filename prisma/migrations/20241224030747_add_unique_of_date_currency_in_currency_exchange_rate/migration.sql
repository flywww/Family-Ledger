/*
  Warnings:

  - A unique constraint covering the columns `[date,currency]` on the table `CurrencyExchangeRate` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CurrencyExchangeRate_currency_key";

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyExchangeRate_date_currency_key" ON "CurrencyExchangeRate"("date", "currency");
