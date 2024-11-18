/*
  Warnings:

  - Changed the type of `accountingDate` on the `Setting` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Setting" DROP COLUMN "accountingDate",
ADD COLUMN     "accountingDate" TIMESTAMP(3) NOT NULL;
