/*
  Warnings:

  - The values [SubscriptionStatus] on the enum `ResourceType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ResourceType_new" AS ENUM ('USER', 'CANINE', 'CERTIFICATE', 'REPORT', 'TRANSFER_OWNERSHIP', 'MEMBERSHIP_PLAN');
ALTER TABLE "notifications" ALTER COLUMN "category" TYPE "ResourceType_new" USING ("category"::text::"ResourceType_new");
ALTER TABLE "access_permissions" ALTER COLUMN "resource" TYPE "ResourceType_new" USING ("resource"::text::"ResourceType_new");
ALTER TYPE "ResourceType" RENAME TO "ResourceType_old";
ALTER TYPE "ResourceType_new" RENAME TO "ResourceType";
DROP TYPE "public"."ResourceType_old";
COMMIT;
