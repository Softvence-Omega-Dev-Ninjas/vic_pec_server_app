-- AlterTable
ALTER TABLE "ownership_transfers" ADD COLUMN     "transferRequestedId" TEXT;

-- AddForeignKey
ALTER TABLE "ownership_transfers" ADD CONSTRAINT "ownership_transfers_transferRequestedId_fkey" FOREIGN KEY ("transferRequestedId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
