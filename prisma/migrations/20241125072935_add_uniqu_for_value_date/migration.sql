/*
  Warnings:

  - A unique constraint covering the columns `[date,categoryId,typeId,userId]` on the table `ValueData` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ValueData_date_categoryId_typeId_userId_key" ON "ValueData"("date", "categoryId", "typeId", "userId");
