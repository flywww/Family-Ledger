/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(30)`.

*/

-- add by GPT
ALTER TABLE "Balance" DROP CONSTRAINT "Balance_userId_fkey" CASCADE;
ALTER TABLE "Holding" DROP CONSTRAINT "Holding_userId_fkey" CASCADE;
ALTER TABLE "Setting" DROP CONSTRAINT "Setting_userId_fkey" CASCADE;
ALTER TABLE "ValueData" DROP CONSTRAINT "ValueData_userId_fkey" CASCADE;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(30),
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- Recreate foreign key constraints
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE;
ALTER TABLE "Holding" ADD CONSTRAINT "Holding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE;
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE;
ALTER TABLE "ValueData" ADD CONSTRAINT "ValueData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE;