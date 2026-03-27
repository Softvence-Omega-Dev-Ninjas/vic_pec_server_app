/*
  Warnings:

  - The values [TIER_UPGRADE,DNA_RETEST] on the enum `RegistrationRequestType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `color` on the `litters` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `litters` table. All the data in the column will be lost.
  - You are about to drop the column `healthClearances` on the `litters` table. All the data in the column will be lost.
  - You are about to drop the column `healthNotes` on the `litters` table. All the data in the column will be lost.
  - You are about to drop the column `healthStatus` on the `litters` table. All the data in the column will be lost.
  - You are about to drop the column `microchipId` on the `litters` table. All the data in the column will be lost.
  - You are about to drop the column `vaccinations` on the `litters` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `litters` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RegistrationRequestType_new" AS ENUM ('NEW_REGISTRATION', 'LITTER_REGISTRATION', 'TRANSFER_REGISTRATION');
ALTER TABLE "public"."canines" ALTER COLUMN "requestType" DROP DEFAULT;
ALTER TABLE "public"."litters" ALTER COLUMN "requestType" DROP DEFAULT;
ALTER TABLE "canines" ALTER COLUMN "requestType" TYPE "RegistrationRequestType_new" USING ("requestType"::text::"RegistrationRequestType_new");
ALTER TABLE "litters" ALTER COLUMN "requestType" TYPE "RegistrationRequestType_new" USING ("requestType"::text::"RegistrationRequestType_new");
ALTER TYPE "RegistrationRequestType" RENAME TO "RegistrationRequestType_old";
ALTER TYPE "RegistrationRequestType_new" RENAME TO "RegistrationRequestType";
DROP TYPE "public"."RegistrationRequestType_old";
ALTER TABLE "canines" ALTER COLUMN "requestType" SET DEFAULT 'NEW_REGISTRATION';
ALTER TABLE "litters" ALTER COLUMN "requestType" SET DEFAULT 'LITTER_REGISTRATION';
COMMIT;

-- DropIndex
DROP INDEX "litters_microchipId_key";

-- AlterTable
ALTER TABLE "canines" ADD COLUMN     "hasPedigreeAgreement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublicProfile" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "microchipId" DROP NOT NULL,
ALTER COLUMN "primaryBreedDNA" DROP NOT NULL;

-- AlterTable
ALTER TABLE "litters" DROP COLUMN "color",
DROP COLUMN "gender",
DROP COLUMN "healthClearances",
DROP COLUMN "healthNotes",
DROP COLUMN "healthStatus",
DROP COLUMN "microchipId",
DROP COLUMN "vaccinations",
DROP COLUMN "weight",
ADD COLUMN     "isAutoDNAVerified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "requestType" SET DEFAULT 'LITTER_REGISTRATION';
