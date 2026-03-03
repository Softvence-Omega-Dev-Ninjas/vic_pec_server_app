-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('USER', 'OWNER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('USER', 'CANINE', 'CERTIFICATE', 'REPORT', 'TRANSFER_OWNERSHIP');

-- CreateTable
CREATE TABLE "canines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "canineLimit" INTEGER NOT NULL DEFAULT 1,
    "canineLimitLabel" TEXT NOT NULL DEFAULT 'Initial Canine Registration(s)',
    "standardPricing" BOOLEAN NOT NULL DEFAULT true,
    "pricingLabel" TEXT NOT NULL DEFAULT 'Standard Pricing on PCR Registration Certificates & Pedigrees',
    "freeLitterReg" BOOLEAN NOT NULL DEFAULT false,
    "litterRegLabel" TEXT NOT NULL DEFAULT 'Standard Litter Registration & Canine Transfer Fees',
    "freeDigitalDownloads" BOOLEAN NOT NULL DEFAULT false,
    "digitalDownloadsLabel" TEXT,
    "directAssistance" BOOLEAN NOT NULL DEFAULT false,
    "assistanceLabel" TEXT,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "ownershipTransferCode" TEXT,
    "membershipId" TEXT NOT NULL,
    "roleType" "RoleType" NOT NULL DEFAULT 'USER',
    "lastLogin" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resources" "ResourceType"[],
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "access_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AccessPermissionToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AccessPermissionToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "canines_registrationNo_key" ON "canines"("registrationNo");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_tier_key" ON "memberships"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "users_userName_key" ON "users"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "access_permissions_name_key" ON "access_permissions"("name");

-- CreateIndex
CREATE INDEX "_AccessPermissionToUser_B_index" ON "_AccessPermissionToUser"("B");

-- AddForeignKey
ALTER TABLE "canines" ADD CONSTRAINT "canines_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccessPermissionToUser" ADD CONSTRAINT "_AccessPermissionToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "access_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccessPermissionToUser" ADD CONSTRAINT "_AccessPermissionToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
