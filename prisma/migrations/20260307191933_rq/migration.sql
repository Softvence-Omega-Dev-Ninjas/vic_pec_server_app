/*
  Warnings:

  - Made the column `microchipId` on table `canines` required. This step will fail if there are existing NULL values in that column.
  - Made the column `primaryBreedDNA` on table `canines` required. This step will fail if there are existing NULL values in that column.
  - Made the column `weight` on table `canines` required. This step will fail if there are existing NULL values in that column.
  - Made the column `weight` on table `litters` required. This step will fail if there are existing NULL values in that column.
  - Made the column `microchipId` on table `litters` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "canines" ALTER COLUMN "microchipId" SET NOT NULL,
ALTER COLUMN "primaryBreedDNA" SET NOT NULL,
ALTER COLUMN "weight" SET NOT NULL;

-- AlterTable
ALTER TABLE "litters" ALTER COLUMN "weight" SET NOT NULL,
ALTER COLUMN "microchipId" SET NOT NULL;
