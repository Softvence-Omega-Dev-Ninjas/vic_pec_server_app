/*
  Warnings:

  - You are about to drop the column `breed` on the `canines` table. All the data in the column will be lost.
  - The `requestType` column on the `canines` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `canines` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `breed` on the `litters` table. All the data in the column will be lost.
  - The `requestType` column on the `litters` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `litters` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `ownership_transfers` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[pcrId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `breedId` to the `canines` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pcrBreedCode` to the `canines` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pcrIncremental` to the `canines` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pcrPrefix` to the `canines` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pcrRandom` to the `canines` table without a default value. This is not possible if the table is not empty.
  - Added the required column `breedId` to the `litters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `generation` to the `litters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pcrBreedCode` to the `litters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pcrIncremental` to the `litters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pcrRandom` to the `litters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pcrId` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pcrIncremental` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pcrPrefix` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pcrRandom` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RegistrationRequestType" AS ENUM ('NEW_REGISTRATION', 'TIER_UPGRADE', 'DNA_RETEST');

-- CreateEnum
CREATE TYPE "CertificateRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINE', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('CERTIFICATE', 'PEDIGREE');

-- CreateEnum
CREATE TYPE "TransferOwnershipStatus" AS ENUM ('PENDING', 'SUCCESSFUL', 'FAILED', 'EXPIRED');

-- AlterTable
ALTER TABLE "canines" DROP COLUMN "breed",
ADD COLUMN     "breedId" TEXT NOT NULL,
ADD COLUMN     "generation" TEXT,
ADD COLUMN     "pcrBreedCode" TEXT NOT NULL,
ADD COLUMN     "pcrIncremental" TEXT NOT NULL,
ADD COLUMN     "pcrPrefix" TEXT NOT NULL,
ADD COLUMN     "pcrRandom" TEXT NOT NULL,
DROP COLUMN "requestType",
ADD COLUMN     "requestType" "RegistrationRequestType" NOT NULL DEFAULT 'NEW_REGISTRATION',
DROP COLUMN "status",
ADD COLUMN     "status" "CertificateRequestStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "litters" DROP COLUMN "breed",
ADD COLUMN     "breedId" TEXT NOT NULL,
ADD COLUMN     "generation" TEXT NOT NULL,
ADD COLUMN     "pcrBreedCode" TEXT NOT NULL,
ADD COLUMN     "pcrIncremental" TEXT NOT NULL,
ADD COLUMN     "pcrPrefix" TEXT NOT NULL DEFAULT 'L',
ADD COLUMN     "pcrRandom" TEXT NOT NULL,
DROP COLUMN "requestType",
ADD COLUMN     "requestType" "RegistrationRequestType" NOT NULL DEFAULT 'NEW_REGISTRATION',
DROP COLUMN "status",
ADD COLUMN     "status" "CertificateRequestStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "ownership_transfers" DROP COLUMN "status",
ADD COLUMN     "status" "TransferOwnershipStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "pcrId" TEXT NOT NULL,
ADD COLUMN     "pcrIncremental" TEXT NOT NULL,
ADD COLUMN     "pcrPrefix" TEXT NOT NULL,
ADD COLUMN     "pcrRandom" TEXT NOT NULL;

-- DropEnum
DROP TYPE "RequestStatus";

-- DropEnum
DROP TYPE "RequestType";

-- DropEnum
DROP TYPE "TransferStatus";

-- CreateTable
CREATE TABLE "breeds" (
    "id" TEXT NOT NULL,
    "breedCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "acronym" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tierEligibility" TEXT,
    "eligibleGen" TEXT,

    CONSTRAINT "breeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_requests" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "canineId" TEXT,
    "litterId" TEXT,
    "certificateType" "CertificateType" NOT NULL DEFAULT 'CERTIFICATE',
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedDate" TIMESTAMP(3),
    "status" "CertificateRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "breeds_breedCode_key" ON "breeds"("breedCode");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_requests_requestId_key" ON "certificate_requests"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "users_pcrId_key" ON "users"("pcrId");

-- AddForeignKey
ALTER TABLE "canines" ADD CONSTRAINT "canines_breedId_fkey" FOREIGN KEY ("breedId") REFERENCES "breeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_requests" ADD CONSTRAINT "certificate_requests_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_requests" ADD CONSTRAINT "certificate_requests_canineId_fkey" FOREIGN KEY ("canineId") REFERENCES "canines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_requests" ADD CONSTRAINT "certificate_requests_litterId_fkey" FOREIGN KEY ("litterId") REFERENCES "litters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "litters" ADD CONSTRAINT "litters_breedId_fkey" FOREIGN KEY ("breedId") REFERENCES "breeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
