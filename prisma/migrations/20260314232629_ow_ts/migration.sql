/*
  Warnings:

  - You are about to drop the column `transferRequestedId` on the `ownership_transfers` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ownership_transfers" DROP CONSTRAINT "ownership_transfers_transferRequestedId_fkey";

-- AlterTable
ALTER TABLE "ownership_transfers" DROP COLUMN "transferRequestedId";

-- CreateTable
CREATE TABLE "transfer_requests" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transfer_requests_transferId_userId_key" ON "transfer_requests"("transferId", "userId");

-- AddForeignKey
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "ownership_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
