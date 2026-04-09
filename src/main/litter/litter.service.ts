/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateLitterDto, UpdateLitterDto } from './dto/create-litter.dto';
import { LitterQueryDto } from './dto/LitterQueryDto';

import { PaymentService } from '../payment/payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class LitterService {
  private readonly logger = new Logger(LitterService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
    private notificationsService: NotificationsService,
    private readonly paymentService: PaymentService,
  ) {}

  private async getNextPcrId(
    kind: string,
    prefix: string,
    breedCode: string,
  ): Promise<string> {
    const sequence = await this.prisma.pcrSequence.upsert({
      where: { kind_prefix_breedCode: { kind, prefix, breedCode } },
      update: { lastValue: { increment: 1 } },
      create: { kind, prefix, breedCode, lastValue: 1 },
    });
    return sequence.lastValue.toString().padStart(5, '0');
  }

  private async getNextPcrIdMany(
    kind: string,
    prefix: string,
    breedCode: string,
    count: number,
  ): Promise<string[]> {
    if (count <= 0) return [];
    const sequence = await this.prisma.pcrSequence.upsert({
      where: { kind_prefix_breedCode: { kind, prefix, breedCode } },
      update: { lastValue: { increment: count } },
      create: { kind, prefix, breedCode, lastValue: count },
    });

    const startValue = sequence.lastValue - count + 1;
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      ids.push((startValue + i).toString().padStart(5, '0'));
    }
    return ids;
  }

  private async calculateGeneration(
    motherId?: string,
    fatherId?: string,
  ): Promise<string | null> {
    if (!motherId || !fatherId) {
      throw new BadRequestException(
        'Both parents must be provided for Litter linkage. If parents are unverified, please register pups individually.',
      );
    }

    const [mother, father] = await Promise.all([
      this.prisma.canine.findUnique({ where: { pcrId: motherId } }),
      this.prisma.canine.findUnique({ where: { pcrId: fatherId } }),
    ]);

    if (!mother || !father) {
      throw new BadRequestException(
        'Both parents must be PCR registered, DNA verified, and microchipped. If not, pups must register individually.',
      );
    }

    // Verification Check: Dam and sire must both be thoroughly verified
    if (
      mother.status !== 'APPROVED' ||
      father.status !== 'APPROVED' ||
      !mother.microchipId ||
      !father.microchipId
    ) {
      throw new BadRequestException(
        'Both parents must be fully verified (PCR registered, DNA verified, and microchipped). If not, please register pups individually.',
      );
    }

    // 1. Both Purebred
    if (!mother.generation && !father.generation) {
      if (mother.breedId === father.breedId) {
        return null; // Purebred
      } else {
        return 'F1'; // F1 Designer
      }
    }

    // 2. F1 x F1
    if (mother.generation === 'F1' && father.generation === 'F1') {
      if (mother.breedId === father.breedId) {
        return 'F2';
      } else {
        return 'VD'; // Different designer pairings result in VD
      }
    }

    // 3. F1 x Purebred -> F1B
    if (
      (mother.generation === 'F1' && !father.generation) ||
      (!mother.generation && father.generation === 'F1')
    ) {
      return 'F1B';
    }

    // 4. Beyond F2 and F1B (Verified Designer Lineage)
    return 'VD';
  }

  async createLitter(
    userId: string,
    dto: CreateLitterDto,
    images: Express.Multer.File[],
    docs: Express.Multer.File[],
  ) {
    try {
      const breed = await this.prisma.breed.findUnique({
        where: { id: dto.breedId },
      });
      if (!breed) throw new NotFoundException('Breed not found');

      // 1. Calculate Generation Automatically
      const calculatedGen = await this.calculateGeneration(
        dto.motherPcrId,
        dto.fatherPcrId,
      );

      // 2. Pricing & Membership Check
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          membership: {
            include: {
              servicePricings: { where: { serviceType: 'LITTER_REG' } },
            },
          },
        },
      });

      if (!user?.membership)
        throw new BadRequestException('Active membership required');

      const pricing = user.membership.servicePricings[0];
      const finalAmount = Math.round(
        (pricing?.price || 0) *
          (1 - (user.membership.litterRegDiscount || 0)) *
          100,
      );

      // 3. Upload Media
      const [imageUrlList, docUrlList] = await Promise.all([
        this.cloudinary.uploadImages(images),
        this.cloudinary.uploadImages(docs),
      ]);

      // 4. Execution: Free vs Paid
      if (finalAmount <= 0) {
        return await this.prisma.$transaction(async (tx) => {
          return await this.executeLitterCreation(
            tx,
            userId,
            dto,
            calculatedGen,
            imageUrlList,
            docUrlList,
            breed,
          );
        });
      }

      return await this.paymentService.createLitterSession(
        userId,
        dto,
        calculatedGen,
        imageUrlList,
        docUrlList,
      );
    } catch (error: any) {
      this.logger.error(`Litter creation failed: ${error.message}`);
      throw error;
    }
  }

  async executeLitterCreation(
    tx: any,
    userId: string,
    dto: any,
    gen: string | null,
    imageUrls: string[],
    docUrls: string[],
    breed: any,
  ) {
    const pcrPrefix = 'L';
    const pcrBreedCode = breed.breedCode;

    // Incremental logic using atomic sequence
    const pcrIncremental = await this.getNextPcrId(
      'LITTER',
      pcrPrefix,
      pcrBreedCode,
    );
    const pcrRandom = Math.floor(100000 + Math.random() * 900000).toString();
    const genPart = gen ? `-${gen}` : '';

    // Create Parent Litter Record
    const litter = await tx.litter.create({
      data: {
        pcrId: `PCR-${pcrPrefix}${pcrBreedCode}${genPart}-${pcrIncremental}-${pcrRandom}`,
        pcrPrefix,
        pcrBreedCode,
        generation: gen,
        pcrIncremental,
        pcrRandom,
        tier: breed.type === 'DESIGNER' ? 'BLUE' : 'GOLD',
        name: dto.litterName,
        breedId: dto.breedId,
        dateOfBirth: new Date(dto.dateOfBirth),
        motherPcrId: dto.motherPcrId,
        fatherPcrId: dto.fatherPcrId,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        country: dto.country,
        ownerId: userId,
        status: 'PENDING',
        requestType: 'LITTER_REGISTRATION',
        images: {
          create: imageUrls.map((url) => ({
            url,
            publicId: url.split('/').pop(),
          })),
        },
        DNAdocuments: {
          create: docUrls.map((url) => ({
            url,
            name: 'Litter DNA',
            publicId: url.split('/').pop(),
          })),
        },
      },
    });

    // Create Puppies efficiently using createMany
    if (dto.puppies && Array.isArray(dto.puppies) && dto.puppies.length > 0) {
      const pupPrefix = breed.type === 'DESIGNER' ? 'B' : 'G';
      const pupCount = dto.puppies.length;

      // Get all puppy sequence numbers in one query
      const pupIncs = await this.getNextPcrIdMany(
        'CANINE',
        pupPrefix,
        pcrBreedCode,
        pupCount,
      );

      const puppiesData: any[] = [];
      const imageRecords: any[] = [];
      const dnaRecords: any[] = [];

      // Import uuid or use random manually. We will use a random 32 char hex if uuid is unavailable, but usually crypto.randomUUID is best.
      // Prisma `createMany` allows explicit IDs, so we generate them to map images.
      const { v4: uuidv4 } = require('uuid');

      for (const [idx, pup] of dto.puppies.entries()) {
        const pupId = uuidv4();
        const pupInc = pupIncs[idx];
        const pupRand = Math.floor(100000 + Math.random() * 900000).toString();
        const pupPcrId = `PCR-${pupPrefix}${pcrBreedCode}${genPart}-${pupInc}-${pupRand}`;

        puppiesData.push({
          id: pupId,
          pcrId: pupPcrId,
          pcrPrefix: pupPrefix,
          pcrBreedCode: pcrBreedCode,
          pcrIncremental: pupInc,
          pcrRandom: pupRand,
          generation: gen,
          name: pup.name,
          gender: pup.gender,
          color: pup.color,
          weight: Number(pup.weight),
          microchipId: pup.microchipId,
          dateOfBirth: new Date(dto.dateOfBirth),
          ownerId: userId,
          breedId: dto.breedId,
          litterId: litter.id,
          tier: pupPrefix === 'G' ? 'GOLD' : 'BLUE',
          city: dto.city,
          state: dto.state,
          country: dto.country,
          zipCode: dto.zipCode,
          healthStatus: pup.healthStatus || 'EXCELLENT',
          vaccinations: pup.vaccinations || [],
          healthClearances: pup.healthClearances || [],
        });

        // Prepare relational assets for bulk insert
        imageUrls.forEach((url) => {
          imageRecords.push({
            url,
            publicId: url.split('/').pop(),
            canineId: pupId,
          });
        });
        docUrls.forEach((url) => {
          dnaRecords.push({
            url,
            name: `${pup.name} DNA Record`,
            publicId: url.split('/').pop(),
            canineId: pupId,
          });
        });
      }

      await tx.canine.createMany({ data: puppiesData });

      if (imageRecords.length > 0) {
        await tx.image.createMany({ data: imageRecords });
      }
      if (dnaRecords.length > 0) {
        await tx.document.createMany({ data: dnaRecords });
      }
    }
    return litter;
  }

  async findAll(query: LitterQueryDto) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy,
        sortOrder,
        breedCode,
      } = query;
      const skip = (page - 1) * limit;

      const where: any = {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { pcrId: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          breedCode ? { pcrBreedCode: breedCode } : {},
        ],
      };

      const [data, total] = await Promise.all([
        this.prisma.litter.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
          include: {
            _count: { select: { puppies: true } },
            breedRelation: { select: { name: true, breedCode: true } },
            owner: { select: { fullName: true, email: true } },
          },
        }),
        this.prisma.litter.count({ where }),
      ]);

      return {
        success: true,
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch litters: ${error.message}`);
      throw new InternalServerErrorException(
        'Could not retrieve litters with pagination',
      );
    }
  }

  async findOne(litterId: string, currentUserId?: string, userRole?: string) {
    try {
      const litter = await this.prisma.litter.findUnique({
        where: { id: litterId },
        include: {
          images: true,
          DNAdocuments: true,
          mother: true,
          father: true,
          breedRelation: true,
          owner: {
            select: { id: true, fullName: true, email: true, pcrId: true },
          },
          puppies: true,
          _count: { select: { puppies: true } },
        },
      });

      if (!litter) {
        throw new NotFoundException(`Litter with ID ${litterId} not found`);
      }

      const isOwner = currentUserId === litter.ownerId;
      const isAdmin = userRole === 'SUPER_ADMIN';

      if (isOwner || isAdmin) {
        return litter;
      }

      let hasApprovedRequest = false;
      if (currentUserId) {
        const approvedRequest = await this.prisma.canineHealthRequest.findFirst(
          {
            where: {
              litterId: litter.id,
              requesterId: currentUserId,
              status: 'APPROVED',
            },
          },
        );
        if (approvedRequest) hasApprovedRequest = true;
      }

      if (!hasApprovedRequest) {
        return {
          ...litter,
          healthStatus: 'HIDDEN (Request Access)',
          healthNotes: 'Contact owner for health details',
          DNAdocuments: [],
          vaccinations: [],
          healthClearances: [],
        };
      }

      return litter;
    } catch (error: any) {
      this.logger.error(`Failed to find litter: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error occurred while fetching litter details',
      );
    }
  }

  async update(litterId: string, dto: UpdateLitterDto, userId: string) {
    try {
      const existingLitter = await this.prisma.litter.findUnique({
        where: { id: litterId },
      });

      if (!existingLitter)
        throw new NotFoundException(`Litter with ID ${litterId} not found`);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      const isSuperAdmin = user?.roleType === 'SUPER_ADMIN';
      if (!isSuperAdmin && existingLitter.ownerId !== userId) {
        throw new ForbiddenException(
          'You do not have permission to update this litter',
        );
      }

      // 4. CRITICAL: Removing relational and restricted fields from the main update data
      const {
        puppies,
        images,
        DNAdocuments,
        vaccinations,
        healthClearances,
        breedId,
        motherPcrId,
        fatherPcrId,
        dateOfBirth,
        litterName,
        // Admin specific fields (Destructured to handle separately or pass if admin)
        status,
        tier,
        ...updateData
      } = dto;

      return await this.prisma.litter.update({
        where: { id: litterId },
        data: {
          ...updateData,
          name: litterName || undefined,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          // Only Admin can change these
          ...(isSuperAdmin && {
            status: status as any,
            tier: tier as any,
          }),
          ...(vaccinations && { vaccinations: { set: vaccinations as any } }),
          ...(healthClearances && {
            healthClearances: { set: healthClearances as any },
          }),
        },
        include: { images: true, DNAdocuments: true, puppies: true },
      });
    } catch (error: any) {
      this.logger.error(`Failed to update litter: ${error.message}`);
      throw error;
    }
  }

  async remove(litterId: string, userId: string, role: string) {
    try {
      const litter = await this.prisma.litter.findUnique({
        where: { id: litterId },
        select: {
          ownerId: true,
          _count: { select: { puppies: true } },
        },
      });

      if (!litter) {
        throw new NotFoundException(`Litter with ID ${litterId} not found`);
      }

      if (role !== 'SUPER_ADMIN' && litter.ownerId !== userId) {
        throw new ConflictException(
          'You do not have permission to delete this litter',
        );
      }

      if (litter._count.puppies > 0) {
        throw new ConflictException(
          'Cannot delete litter because it has registered puppies',
        );
      }

      return await this.prisma.litter.delete({
        where: { id: litterId },
      });
    } catch (error: any) {
      this.logger.error(`Failed to delete litter: ${error.message}`);

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Could not delete litter at this time',
      );
    }
  }

  async getMyLitters(userId: string, query: LitterQueryDto) {
    try {
      const { page = 1, limit = 10, search, breedCode } = query;
      const skip = (page - 1) * limit;

      const where: any = {
        ownerId: userId,
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { pcrId: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          breedCode ? { pcrBreedCode: breedCode } : {},
        ],
      };

      const [data, total] = await Promise.all([
        this.prisma.litter.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { puppies: true } },
            breedRelation: { select: { name: true } },
          },
        }),
        this.prisma.litter.count({ where }),
      ]);

      return {
        success: true,
        data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Failed to fetch your litters');
    }
  }
}
