/*
  Warnings:

  - You are about to drop the column `description` on the `access_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `access_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `resources` on the `access_permissions` table. All the data in the column will be lost.
  - You are about to drop the `_AccessPermissionToUser` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,resource]` on the table `access_permissions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `resource` to the `access_permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `access_permissions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_AccessPermissionToUser" DROP CONSTRAINT "_AccessPermissionToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_AccessPermissionToUser" DROP CONSTRAINT "_AccessPermissionToUser_B_fkey";

-- DropIndex
DROP INDEX "access_permissions_name_key";

-- AlterTable
ALTER TABLE "access_permissions" DROP COLUMN "description",
DROP COLUMN "name",
DROP COLUMN "resources",
ADD COLUMN     "resource" "ResourceType" NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "showOwnerId" SET DEFAULT true;

-- DropTable
DROP TABLE "_AccessPermissionToUser";

-- CreateIndex
CREATE UNIQUE INDEX "access_permissions_userId_resource_key" ON "access_permissions"("userId", "resource");

-- AddForeignKey
ALTER TABLE "access_permissions" ADD CONSTRAINT "access_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
