/*
  Warnings:

  - You are about to drop the column `dob` on the `canines` table. All the data in the column will be lost.
  - You are about to drop the column `registrationNo` on the `canines` table. All the data in the column will be lost.
  - You are about to drop the column `userName` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pcrId]` on the table `canines` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[microchipId]` on the table `canines` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `city` to the `canines` table without a default value. This is not possible if the table is not empty.
  - Added the required column `color` to the `canines` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `canines` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateOfBirth` to the `canines` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pcrId` to the `canines` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `canines` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zipCode` to the `canines` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `gender` on the `canines` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `city` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zipCode` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "VaccinationType" AS ENUM ('RABIES', 'DHPP', 'BORDETELLA', 'LEPTOSPIROSIS', 'LYME', 'INFLUENZA');

-- CreateEnum
CREATE TYPE "HealthClearance" AS ENUM ('HIP_DYSPLASIA', 'ELBOW_CLEAR', 'EYE_CLEARANCE_CERF', 'HEART_CLEARANCE', 'PRA_CLEAR', 'DM_CLEAR');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('NEW_REGISTRATION', 'TIER_UPGRADE', 'DNA_RETEST');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVE', 'DECLINE');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('GOLD', 'SILVER', 'NONE');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'SUCCESSFUL', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('UNREAD', 'READ', 'RESOLVED');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- DropIndex
DROP INDEX "canines_registrationNo_key";

-- DropIndex
DROP INDEX "users_userName_key";

-- AlterTable
ALTER TABLE "canines" DROP COLUMN "dob",
DROP COLUMN "registrationNo",
ADD COLUMN     "assignedTier" "VerificationType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "color" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "healthClearances" "HealthClearance"[],
ADD COLUMN     "healthNotes" TEXT,
ADD COLUMN     "healthStatus" TEXT NOT NULL DEFAULT 'Excellent',
ADD COLUMN     "litterId" TEXT,
ADD COLUMN     "microchipId" TEXT,
ADD COLUMN     "pcrId" TEXT NOT NULL,
ADD COLUMN     "primaryBreedDNA" TEXT,
ADD COLUMN     "requestType" "RequestType" NOT NULL DEFAULT 'NEW_REGISTRATION',
ADD COLUMN     "secondaryBreedDNA" TEXT,
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "vaccinations" "VaccinationType"[],
ADD COLUMN     "weight" DOUBLE PRECISION,
ADD COLUMN     "zipCode" TEXT NOT NULL,
DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender" NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "userName",
ADD COLUMN     "about" TEXT,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showOwnerId" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "zipCode" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "canineId" TEXT,
    "litterId" TEXT,
    "userProfileId" TEXT,
    "userCoverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "litterId" TEXT,
    "canineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "litters" (
    "id" TEXT NOT NULL,
    "pcrId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "color" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "microchipId" TEXT,
    "healthStatus" TEXT NOT NULL DEFAULT 'Excellent',
    "vaccinations" "VaccinationType"[],
    "healthClearances" "HealthClearance"[],
    "healthNotes" TEXT,
    "motherPcrId" TEXT,
    "fatherPcrId" TEXT,
    "ownerId" TEXT NOT NULL,
    "requestType" "RequestType" NOT NULL DEFAULT 'NEW_REGISTRATION',
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "assignedTier" "VerificationType" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "litters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ownership_transfers" (
    "id" TEXT NOT NULL,
    "transferCode" TEXT NOT NULL,
    "canineId" TEXT,
    "litterId" TEXT,
    "currentOwnerId" TEXT NOT NULL,
    "newOwnerId" TEXT,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ownership_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'UNREAD',
    "priority" "PriorityLevel" NOT NULL DEFAULT 'MEDIUM',
    "reason" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reporterName" TEXT NOT NULL,
    "reporterEmail" TEXT NOT NULL,
    "reporterId" TEXT,
    "canineId" TEXT,
    "litterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "images_userProfileId_key" ON "images"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "images_userCoverId_key" ON "images"("userCoverId");

-- CreateIndex
CREATE UNIQUE INDEX "litters_pcrId_key" ON "litters"("pcrId");

-- CreateIndex
CREATE UNIQUE INDEX "litters_microchipId_key" ON "litters"("microchipId");

-- CreateIndex
CREATE UNIQUE INDEX "ownership_transfers_transferCode_key" ON "ownership_transfers"("transferCode");

-- CreateIndex
CREATE UNIQUE INDEX "reports_reportId_key" ON "reports"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "canines_pcrId_key" ON "canines"("pcrId");

-- CreateIndex
CREATE UNIQUE INDEX "canines_microchipId_key" ON "canines"("microchipId");

-- AddForeignKey
ALTER TABLE "canines" ADD CONSTRAINT "canines_litterId_fkey" FOREIGN KEY ("litterId") REFERENCES "litters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_canineId_fkey" FOREIGN KEY ("canineId") REFERENCES "canines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_litterId_fkey" FOREIGN KEY ("litterId") REFERENCES "litters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_userCoverId_fkey" FOREIGN KEY ("userCoverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_litterId_fkey" FOREIGN KEY ("litterId") REFERENCES "litters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_canineId_fkey" FOREIGN KEY ("canineId") REFERENCES "canines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "litters" ADD CONSTRAINT "litters_motherPcrId_fkey" FOREIGN KEY ("motherPcrId") REFERENCES "canines"("pcrId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "litters" ADD CONSTRAINT "litters_fatherPcrId_fkey" FOREIGN KEY ("fatherPcrId") REFERENCES "canines"("pcrId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "litters" ADD CONSTRAINT "litters_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_transfers" ADD CONSTRAINT "ownership_transfers_canineId_fkey" FOREIGN KEY ("canineId") REFERENCES "canines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_transfers" ADD CONSTRAINT "ownership_transfers_litterId_fkey" FOREIGN KEY ("litterId") REFERENCES "litters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_transfers" ADD CONSTRAINT "ownership_transfers_currentOwnerId_fkey" FOREIGN KEY ("currentOwnerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownership_transfers" ADD CONSTRAINT "ownership_transfers_newOwnerId_fkey" FOREIGN KEY ("newOwnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_canineId_fkey" FOREIGN KEY ("canineId") REFERENCES "canines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_litterId_fkey" FOREIGN KEY ("litterId") REFERENCES "litters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
