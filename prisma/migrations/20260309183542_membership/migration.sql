/*
  Warnings:

  - You are about to drop the column `stripePriceId` on the `memberships` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "memberships_stripePriceId_key";

-- AlterTable
ALTER TABLE "memberships" DROP COLUMN "stripePriceId";
