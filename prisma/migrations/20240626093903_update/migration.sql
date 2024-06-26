/*
  Warnings:

  - You are about to drop the column `customerId` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "customerId",
ALTER COLUMN "paid_at" DROP NOT NULL,
ALTER COLUMN "channel" DROP NOT NULL;
