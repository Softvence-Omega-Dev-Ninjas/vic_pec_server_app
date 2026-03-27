/*
  Warnings:

  - The values [MEMBERSHIP_PLAN] on the enum `ResourceType` will be removed. If these variants are still used in the database, this will fail.
  - Changed the type of `status` on the `subscriptions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('CANINE_REG', 'LITTER_REG', 'TRANSFER', 'CERTIFICATE');

-- AlterEnum
BEGIN;
CREATE TYPE "ResourceType_new" AS ENUM ('USER', 'CANINE', 'CERTIFICATE', 'REPORT', 'TRANSFER_OWNERSHIP');
ALTER TABLE "notifications" ALTER COLUMN "category" TYPE "ResourceType_new" USING ("category"::text::"ResourceType_new");
ALTER TABLE "access_permissions" ALTER COLUMN "resource" TYPE "ResourceType_new" USING ("resource"::text::"ResourceType_new");
ALTER TYPE "ResourceType" RENAME TO "ResourceType_old";
ALTER TYPE "ResourceType_new" RENAME TO "ResourceType";
DROP TYPE "public"."ResourceType_old";
COMMIT;

-- AlterTable
ALTER TABLE "memberships" ADD COLUMN     "canineRegDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "certificateDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "litterRegDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "transferDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- DropEnum
DROP TYPE "SubscriptionStatus";

-- CreateTable
CREATE TABLE "service_pricings" (
    "id" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "membershipId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_pricings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_pricings_serviceType_key" ON "service_pricings"("serviceType");

-- CreateIndex
CREATE UNIQUE INDEX "service_pricings_serviceType_membershipId_key" ON "service_pricings"("serviceType", "membershipId");

-- AddForeignKey
ALTER TABLE "service_pricings" ADD CONSTRAINT "service_pricings_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
