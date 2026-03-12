/*
  Warnings:

  - The `status` column on the `canines` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `litters` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CanineStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINE', 'UNDER_REVIEW');

-- AlterTable
ALTER TABLE "canines" DROP COLUMN "status",
ADD COLUMN     "status" "CanineStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "litters" DROP COLUMN "status",
ADD COLUMN     "status" "CanineStatus" NOT NULL DEFAULT 'PENDING';
