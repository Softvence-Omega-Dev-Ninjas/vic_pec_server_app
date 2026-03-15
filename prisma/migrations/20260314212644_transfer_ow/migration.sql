/*
  Warnings:

  - The values [SUCCESSFUL,FAILED,EXPIRED] on the enum `TransferOwnershipStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TransferOwnershipStatus_new" AS ENUM ('PENDING', 'APPROVE', 'DECLINE');
ALTER TABLE "public"."ownership_transfers" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ownership_transfers" ALTER COLUMN "status" TYPE "TransferOwnershipStatus_new" USING ("status"::text::"TransferOwnershipStatus_new");
ALTER TYPE "TransferOwnershipStatus" RENAME TO "TransferOwnershipStatus_old";
ALTER TYPE "TransferOwnershipStatus_new" RENAME TO "TransferOwnershipStatus";
DROP TYPE "public"."TransferOwnershipStatus_old";
ALTER TABLE "ownership_transfers" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "ownership_transfers" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ownership_transfers_transferCode_idx" ON "ownership_transfers"("transferCode");

-- CreateIndex
CREATE INDEX "ownership_transfers_status_idx" ON "ownership_transfers"("status");
