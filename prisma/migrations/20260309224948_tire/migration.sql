-- CreateEnum
CREATE TYPE "RegistryTier" AS ENUM ('GOLD', 'BLUE');

-- AlterTable
ALTER TABLE "canines" ADD COLUMN     "tier" "RegistryTier" NOT NULL DEFAULT 'BLUE';

-- AlterTable
ALTER TABLE "litters" ADD COLUMN     "tier" "RegistryTier" NOT NULL DEFAULT 'BLUE';
