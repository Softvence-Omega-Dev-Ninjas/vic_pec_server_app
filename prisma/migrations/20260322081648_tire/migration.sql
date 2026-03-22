/*
  Warnings:

  - The values [SILVER] on the enum `VerificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VerificationType_new" AS ENUM ('GOLD', 'BLUE', 'NONE');
ALTER TABLE "public"."canines" ALTER COLUMN "assignedTier" DROP DEFAULT;
ALTER TABLE "public"."litters" ALTER COLUMN "assignedTier" DROP DEFAULT;
ALTER TABLE "canines" ALTER COLUMN "assignedTier" TYPE "VerificationType_new" USING ("assignedTier"::text::"VerificationType_new");
ALTER TABLE "litters" ALTER COLUMN "assignedTier" TYPE "VerificationType_new" USING ("assignedTier"::text::"VerificationType_new");
ALTER TYPE "VerificationType" RENAME TO "VerificationType_old";
ALTER TYPE "VerificationType_new" RENAME TO "VerificationType";
DROP TYPE "public"."VerificationType_old";
ALTER TABLE "canines" ALTER COLUMN "assignedTier" SET DEFAULT 'NONE';
ALTER TABLE "litters" ALTER COLUMN "assignedTier" SET DEFAULT 'NONE';
COMMIT;
