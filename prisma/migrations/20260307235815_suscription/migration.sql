/*
  Warnings:

  - You are about to drop the column `assistanceLabel` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `canineLimitLabel` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `digitalDownloadsLabel` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `directAssistance` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `freeDigitalDownloads` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `freeLitterReg` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `litterRegLabel` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `pricingLabel` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `standardPricing` on the `memberships` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripePriceId]` on the table `memberships` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `memberships` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "memberships" DROP COLUMN "assistanceLabel",
DROP COLUMN "canineLimitLabel",
DROP COLUMN "digitalDownloadsLabel",
DROP COLUMN "directAssistance",
DROP COLUMN "freeDigitalDownloads",
DROP COLUMN "freeLitterReg",
DROP COLUMN "litterRegLabel",
DROP COLUMN "price",
DROP COLUMN "pricingLabel",
DROP COLUMN "standardPricing",
ADD COLUMN     "currentPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "features" JSONB,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "stripePriceId" TEXT;

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_stripePriceId_key" ON "memberships"("stripePriceId");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
