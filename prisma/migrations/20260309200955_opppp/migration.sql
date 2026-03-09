-- DropForeignKey
ALTER TABLE "canine_health_requests" DROP CONSTRAINT "canine_health_requests_canineId_fkey";

-- AlterTable
ALTER TABLE "canine_health_requests" ALTER COLUMN "canineId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "canine_health_requests" ADD CONSTRAINT "canine_health_requests_canineId_fkey" FOREIGN KEY ("canineId") REFERENCES "canines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
