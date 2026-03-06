-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_membershipId_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "membershipId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
