-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PAID', 'UNPAID', 'CANCELED');

-- AlterEnum
ALTER TYPE "ResourceType" ADD VALUE 'SubscriptionStatus';
