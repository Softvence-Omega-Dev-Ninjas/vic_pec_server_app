-- CreateEnum
CREATE TYPE "HealthRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED');

-- CreateTable
CREATE TABLE "canine_health_requests" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "canineId" TEXT NOT NULL,
    "litterId" TEXT,
    "ownerId" TEXT NOT NULL,
    "status" "HealthRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "accessDuration" INTEGER DEFAULT 7,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canine_health_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "canine_health_requests" ADD CONSTRAINT "canine_health_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canine_health_requests" ADD CONSTRAINT "canine_health_requests_canineId_fkey" FOREIGN KEY ("canineId") REFERENCES "canines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canine_health_requests" ADD CONSTRAINT "canine_health_requests_litterId_fkey" FOREIGN KEY ("litterId") REFERENCES "litters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canine_health_requests" ADD CONSTRAINT "canine_health_requests_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
