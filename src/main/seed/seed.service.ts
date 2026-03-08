/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ResourceType, RoleType } from 'generated/prisma/enums';
// import { ResourceType, RoleType } from '@prisma/client';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      this.logger.log('🌱 Starting Seeding process...');

      // const foundationalMembership = await this.seedMemberships();
      // if (!foundationalMembership)
      //   throw new Error('❌ Membership seeding failed.');

      // const superAdmin = await this.seedSuperAdmin(foundationalMembership.id);

      // await this.seedAccessPermissions(superAdmin.id);

      await this.seedBreeds();

      this.logger.log('✅ Seeding completed successfully.');
    } catch (error: any) {
      this.logger.error('❌ Seeding failed:', error.message);
    }
  }
  // async seedMemberships() {
  //   const tiers = [
  //     {
  //       tier: 'FOUNDATIONAL',
  //       price: 0,
  //       canineLimit: 1,
  //       canineLimitLabel: 'One (1) Initial Canine Registration',
  //       pricingLabel:
  //         'Standard Pricing on PCR Registration Certificates & Pedigrees',
  //       litterRegLabel: 'Standard Litter Registration & Canine Transfer Fees',
  //       freeLitterReg: false,
  //       freeDigitalDownloads: false,
  //       directAssistance: false,
  //     },
  //     {
  //       tier: 'REGISTRY',
  //       price: 65,
  //       canineLimit: 3,
  //       canineLimitLabel: 'Three (3) Initial Canine Registrations',
  //       pricingLabel: 'Discounted PCR Registrations, Certificates & Pedigrees',
  //       litterRegLabel:
  //         'Discounted Litter Registrations & Canine Transfer Fees',
  //       digitalDownloadsLabel:
  //         'Free Digital Downloads of Certificates & Pedigrees',
  //       freeLitterReg: false,
  //       freeDigitalDownloads: true,
  //       directAssistance: false,
  //     },
  //     {
  //       tier: 'PRESTIGE',
  //       price: 150,
  //       canineLimit: 7,
  //       canineLimitLabel: 'Seven (7) Initial Canine Registrations',
  //       pricingLabel:
  //         'Complimentary Registration Certificate & Canine Pedigree*',
  //       litterRegLabel: 'Free Litter Registrations & Canine Transfers',
  //       digitalDownloadsLabel: "Access to PCR's Private PA Communication Group",
  //       assistanceLabel: 'Direct PA Assistance',
  //       freeLitterReg: true,
  //       freeDigitalDownloads: true,
  //       directAssistance: true,
  //     },
  //   ];

  //   for (const t of tiers) {
  //     await this.prisma.membership.upsert({
  //       where: { tier: t.tier },
  //       update: t,
  //       create: t,
  //     });
  //   }
  //   this.logger.log('✅ Membership Tiers seeded.');

  //   return await this.prisma.membership.findUnique({
  //     where: { tier: 'FOUNDATIONAL' },
  //   });
  // }

  async seedAccessPermissions(superAdminId: string) {
    const allResources = Object.values(ResourceType) as ResourceType[];

    for (const resource of allResources) {
      await this.prisma.accessPermission.upsert({
        where: {
          userId_resource: {
            userId: superAdminId,
            resource: resource,
          },
        },
        update: {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
        },
        create: {
          userId: superAdminId,
          resource: resource,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
        },
      });
    }
    this.logger.log('✅ Full Permissions assigned to Super Admin.');
  }

  // 3. Super Admin Seed
  async seedSuperAdmin(membershipId: string) {
    const adminEmail = 'superadmin@gmail.com';
    const hashedPassword = await bcrypt.hash('superadmin@gmail.com', 10);
    const randomPart = Math.floor(100000 + Math.random() * 900000).toString();

    const superAdmin = await this.prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        roleType: RoleType.SUPER_ADMIN,
        status: 'ACTIVE' as any,
        isVerified: true,
      },
      create: {
        fullName: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        roleType: RoleType.SUPER_ADMIN,
        membershipId: membershipId,
        pcrPrefix: 'CEO',
        pcrIncremental: '0001',
        pcrRandom: randomPart,
        pcrId: `PCR-CEO0001-${randomPart}`,
        city: 'System',
        state: 'System',
        zipCode: '0000',
        country: 'System',
        isVerified: true,
        status: 'ACTIVE' as any,
      },
    });

    this.logger.log(`✅ Super Admin is ready (ID: ${superAdmin.id})`);
    return superAdmin;
  }
  // 4. Breeds Seed (From your Screenshots)
  async seedBreeds() {
    const breedsData = [
      // --- DESIGNER BREEDS (Excel Sheet 1) ---
      {
        breedCode: '301',
        name: 'Labradoodle',
        acronym: 'LBD',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '302',
        name: 'Goldendoodle',
        acronym: 'GLD',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '303',
        name: 'Bernedoodle',
        acronym: 'BRD',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '304',
        name: 'Aussiedoodle',
        acronym: 'ASD',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '305',
        name: 'Sheepadoodle',
        acronym: 'SPD',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '306',
        name: 'Cavapoo',
        acronym: 'CVP',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '307',
        name: 'Cockapoo',
        acronym: 'CKP',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '308',
        name: 'Pomsky',
        acronym: 'PMS',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1',
      },
      {
        breedCode: '309',
        name: 'Maltipoo',
        acronym: 'MTP',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '310',
        name: 'Yorkipoo',
        acronym: 'YKP',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '311',
        name: 'Havapoo',
        acronym: 'HVP',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '312',
        name: 'Schnoodle',
        acronym: 'SND',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '313',
        name: 'Shih-poo',
        acronym: 'SHP',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '314',
        name: 'Peekapoo',
        acronym: 'PKP',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '315',
        name: 'Puggle',
        acronym: 'PGL',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1',
      },
      {
        breedCode: '316',
        name: 'Doberdoodle',
        acronym: 'DBD',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1',
      },
      {
        breedCode: '317',
        name: 'Boxerdoodle',
        acronym: 'BXD',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1',
      },
      {
        breedCode: '318',
        name: 'Newfypoo',
        acronym: 'NFP',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '319',
        name: 'Saint Berdoodle',
        acronym: 'SBD',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '320',
        name: 'Pyredoodle',
        acronym: 'PRD',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '321',
        name: 'Whoodle',
        acronym: 'WHL',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '322',
        name: 'Irish Doodle',
        acronym: 'IRD',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '323',
        name: 'Springerdoodle',
        acronym: 'SRD',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '324',
        name: 'Double Doodle',
        acronym: 'DDD',
        type: 'DESIGNER',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: 'F1, F1B',
      },
      {
        breedCode: '325',
        name: 'French Boodle',
        acronym: 'FBD',
        type: 'DESIGNER',
        tierEligibility: 'Health Review Required',
        eligibleGen: 'F1, F1B',
      },

      // --- INTERNAL BREEDS (Excel Sheet 2) ---
      {
        breedCode: '049',
        name: 'Akita',
        acronym: 'AKT',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '053',
        name: 'Beagle',
        acronym: 'BGL',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '012',
        name: 'Afghan Hound',
        acronym: 'AFH',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '062',
        name: 'Border Collie',
        acronym: 'BCL',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '065',
        name: 'Boxer',
        acronym: 'BXR',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '071',
        name: 'Bulldog',
        acronym: 'BLD',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '082',
        name: 'Chihuahua',
        acronym: 'CHI',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '095',
        name: 'Dachshund',
        acronym: 'DCH',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '101',
        name: 'Doberman Pinscher',
        acronym: 'DOB',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '119',
        name: 'German Shepherd Dog',
        acronym: 'GSD',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '124',
        name: 'Golden Retriever',
        acronym: 'GRT',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '131',
        name: 'Great Dane',
        acronym: 'GRD',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '145',
        name: 'Labrador Retriever',
        acronym: 'LAB',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '158',
        name: 'Mastiff',
        acronym: 'MST',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '182',
        name: 'Poodle (Standard)',
        acronym: 'PDS',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '183',
        name: 'Poodle (Miniature)',
        acronym: 'PDM',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '184',
        name: 'Poodle (Toy)',
        acronym: 'PDT',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '188',
        name: 'Pug',
        acronym: 'PUG',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '194',
        name: 'Rottweiler',
        acronym: 'ROT',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '202',
        name: 'Siberian Husky',
        acronym: 'SHB',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
      {
        breedCode: '211',
        name: 'Shih Tzu',
        acronym: 'STZ',
        type: 'INTERNAL',
        tierEligibility: 'Gold - Auto Eligible',
        eligibleGen: null,
      },
    ];

    for (const b of breedsData) {
      await this.prisma.breed.upsert({
        where: { breedCode: b.breedCode },
        update: b,
        create: b,
      });
    }
    this.logger.log('✅ Breed data (Designer & Internal) seeded.');
  }
}
