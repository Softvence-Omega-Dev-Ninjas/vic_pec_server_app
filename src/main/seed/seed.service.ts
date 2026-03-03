/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ResourceType, RoleType } from 'generated/prisma/enums';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedMemberships();
    const adminPermissions = await this.seedAccessPermissions();
    await this.seedSuperAdmin(adminPermissions);
  }

  // 1. Memberships Seed (Exact Figma Tiers & Features)
  async seedMemberships() {
    const tiers = [
      {
        tier: 'FOUNDATIONAL',
        price: 0,
        canineLimit: 1,
        canineLimitLabel: 'One (1) Initial Canine Registration',
        pricingLabel:
          'Standard Pricing on PCR Registration Certificates & Pedigrees',
        litterRegLabel: 'Standard Litter Registration & Canine Transfer Fees',
        // Figma features/booleans
        freeLitterReg: false,
        freeDigitalDownloads: false,
        directAssistance: false,
      },
      {
        tier: 'REGISTRY',
        price: 65,
        canineLimit: 3,
        canineLimitLabel: 'Three (3) Initial Canine Registrations',
        pricingLabel: 'Discounted PCR Registrations, Certificates & Pedigrees',
        litterRegLabel:
          'Discounted Litter Registrations & Canine Transfer Fees',
        digitalDownloadsLabel:
          'Free Digital Downloads of Certificates & Pedigrees',
        // Figma features/booleans
        freeLitterReg: false,
        freeDigitalDownloads: true,
        directAssistance: false,
      },
      {
        tier: 'PRESTIGE',
        price: 150,
        canineLimit: 7,
        canineLimitLabel: 'Seven (7) Initial Canine Registrations',
        pricingLabel:
          'Complimentary Registration Certificate & Canine Pedigree*',
        litterRegLabel: 'Free Litter Registrations & Canine Transfers',
        digitalDownloadsLabel: "Access to PCR's Private PA Communication Group",
        assistanceLabel: 'Direct PA Assistance',
        // Figma features/booleans
        freeLitterReg: true,
        freeDigitalDownloads: true,
        directAssistance: true,
      },
    ];

    for (const t of tiers) {
      await this.prisma.membership.upsert({
        where: { tier: t.tier },
        update: t, // Figma-r text change holeo jate database update hoy
        create: t,
      });
    }
    this.logger.log('✅ Figma Pricing Tiers seeded successfully.');
  }

  // 2. Access Permissions Seed
  async seedAccessPermissions() {
    const allResources = Object.values(ResourceType);

    const fullAccess = await this.prisma.accessPermission.upsert({
      where: { name: 'Full Admin Access' },
      update: { resources: allResources },
      create: {
        name: 'Full Admin Access',
        description: 'Complete access to all modules.',
        resources: allResources,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      },
    });
    return fullAccess;
  }

  // 3. Super Admin Seed
  async seedSuperAdmin(permission: any) {
    const adminEmail = 'superadmin@gmail.com';

    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const foundational = await this.prisma.membership.findFirst({
          where: { tier: 'FOUNDATIONAL' },
        });

        await this.prisma.user.create({
          data: {
            userName: 'superadmin',
            email: adminEmail,
            password: hashedPassword,
            roleType: RoleType.SUPER_ADMIN,
            membershipId: foundational!.id,
            permissions: {
              connect: [{ id: permission.id }],
            },
          },
        });
        this.logger.log(`✅ Super Admin (${adminEmail}) seeded!`);
      }
    } catch (error: any) {
      this.logger.error('❌ Seed Error:', error.message);
    }
  }
}
