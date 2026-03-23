/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/main/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { RegisterCanineDto, UpdateCanineDto } from './dto/create-canine.dto';
import { CanineQueryDto } from './dto/canine-query.dto';
import { RegistryTier, ResourceType } from 'generated/prisma/enums';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class CanineService {
  private readonly logger = new Logger(CanineService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
    private notificationsService: NotificationsService,
  ) {}

  // 1. Register Canine
  async registerCanine(
    userId: string,
    dto: RegisterCanineDto,
    images: Express.Multer.File[],
    docs: Express.Multer.File[],
  ) {
    try {
      const breed = await this.prisma.breed.findUnique({
        where: { id: dto.breedId },
      });

      if (!breed) {
        throw new NotFoundException(`Breed with ID ${dto.breedId} not found`);
      }

      const pcrPrefix = breed.type === 'DESIGNER' ? 'G' : 'B';
      const pcrBreedCode = breed.breedCode;

      if (breed.type === 'DESIGNER' && !dto.generation) {
        throw new BadRequestException(
          'Generation is required for Designer breeds',
        );
      }

      const lastCanine = await this.prisma.canine.findFirst({
        where: { pcrPrefix, pcrBreedCode },
        orderBy: { pcrIncremental: 'desc' },
      });

      const nextInc = lastCanine ? parseInt(lastCanine.pcrIncremental) + 1 : 1;
      const pcrIncremental = nextInc.toString().padStart(5, '0');
      const pcrRandom = Math.floor(100000 + Math.random() * 900000).toString();
      const pcrId = `PCR-${pcrPrefix}${pcrBreedCode}-${pcrIncremental}-${pcrRandom}`;

      const [imageUrlList, docUrlList] = await Promise.all([
        this.cloudinary.uploadImages(images),
        this.cloudinary.uploadImages(docs),
      ]);
      const tier = pcrPrefix === 'G' ? RegistryTier.GOLD : RegistryTier.BLUE;

      const newCanine = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.canine.findUnique({
          where: { microchipId: dto.microchipId },
        });

        if (existing) {
          throw new ConflictException('Microchip ID already exists');
        }

        return await tx.canine.create({
          data: {
            ...dto,
            dateOfBirth: new Date(dto.dateOfBirth),
            pcrId,
            pcrPrefix,
            pcrBreedCode,
            pcrIncremental,
            pcrRandom,
            tier,
            ownerId: userId,
            images: {
              create: (imageUrlList as string[]).map((url) => ({
                url,
                publicId:
                  url.split('/').pop()?.split('.')[0] ||
                  `img-${Math.random().toString(36).substring(7)}`,
              })),
            },
            DNAdocuments: {
              create: (docUrlList as string[]).map((url) => ({
                url,
                name: 'Canine DNA Report',
                publicId:
                  url.split('/').pop()?.split('.')[0] ||
                  `doc-${Math.random().toString(36).substring(7)}`,
              })),
            },
          },
          include: {
            images: true,
            DNAdocuments: true,
            breedRelation: { select: { name: true, breedCode: true } },
            owner: { select: { fullName: true, pcrId: true } },
          },
        });
      });

      await this.notificationsService.alertAdmins({
        title: 'New Canine Registry',
        message: `A new canine "${newCanine.name}" has been registered.`,
        category: ResourceType.CANINE,
        link: `/admin/canines/${newCanine.id}`,
        sourceId: newCanine.id,
      });

      return newCanine;
    } catch (error: any) {
      this.logger.error(`Canine registration failed: ${error.message}`);
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Failed to register canine',
      );
    }
  }

  // 2. Find All Canines (with Pagination, Filter, Search)
  async findAll(query: CanineQueryDto) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy,
        sortOrder,
        breedId,
        breedName,
        gender,
        tier,
        color,
        status,
      } = query;

      const skip = (page - 1) * limit;

      const where: any = {
        AND: [
          // Global Search
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { pcrId: { contains: search, mode: 'insensitive' } },
                  { microchipId: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          // Specific Filters
          breedId ? { breedId } : {},
          gender ? { gender } : {},
          tier ? { tier } : {},
          status ? { status } : {},
          color ? { color: { contains: color, mode: 'insensitive' } } : {},
          // Nested Breed Name Filter
          breedName
            ? {
                breedRelation: {
                  name: { contains: breedName, mode: 'insensitive' },
                },
              }
            : {},
        ],
      };

      const [data, total] = await Promise.all([
        this.prisma.canine.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
          include: {
            breedRelation: { select: { name: true, breedCode: true } },
            owner: {
              select: { id: true, fullName: true, email: true, pcrId: true },
            },
            images: { take: 1 },
          },
        }),
        this.prisma.canine.count({ where }),
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
      this.logger.error(`Failed to fetch canines: ${error.message}`);
      throw new InternalServerErrorException('Could not retrieve canines');
    }
  }

  async findOne(canineId: string, currentUserId?: string, userRole?: string) {
    try {
      const canine = await this.prisma.canine.findUnique({
        where: { id: canineId },
        include: {
          images: true,
          DNAdocuments: true,
          breedRelation: true,
          owner: {
            select: { id: true, fullName: true, email: true, pcrId: true },
          },
          litter: { include: { breedRelation: true } },
          asMother: { select: { id: true, pcrId: true } },
          asFather: { select: { id: true, pcrId: true } },
        },
      });

      if (!canine)
        throw new NotFoundException(`Canine with ID ${canineId} not found`);
      const isOwner = currentUserId === canine.ownerId;
      const isAdmin = userRole === 'SUPER_ADMIN';

      if (isOwner || isAdmin) {
        return canine;
      }

      let hasApprovedRequest = false;
      if (currentUserId) {
        const approvedRequest = await this.prisma.canineHealthRequest.findFirst(
          {
            where: {
              canineId: canine.id,
              requesterId: currentUserId,
              status: 'APPROVED',
            },
          },
        );
        if (approvedRequest) hasApprovedRequest = true;
      }

      if (!hasApprovedRequest) {
        return {
          ...canine,
          healthStatus: 'HIDDEN (Request Access)',
          healthNotes: 'Contact owner for health details',
          primaryBreedDNA: 'HIDDEN',
          secondaryBreedDNA: 'HIDDEN',
          DNAdocuments: [],
          vaccinations: [],
          healthClearances: [],
        };
      }

      return canine;
    } catch (error: any) {
      this.logger.error(`Failed to find canine: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error fetching canine details');
    }
  }

  // 4. Update Canine
  async update(
    canineId: string,
    dto: UpdateCanineDto,
    userId: string,
    role: string,
  ) {
    try {
      const existingCanine = await this.findOne(canineId);

      // Ownership Check
      if (role !== 'SUPER_ADMIN' && existingCanine.ownerId !== userId) {
        throw new ConflictException(
          'You do not have permission to update this canine',
        );
      }

      if (dto.microchipId) {
        const microchipCheck = await this.prisma.canine.findFirst({
          where: { microchipId: dto.microchipId, id: { not: canineId } },
        });
        if (microchipCheck)
          throw new ConflictException('Microchip ID already in use');
      }

      // 1. Destructure fields that are not part of the database columns or need special handling
      const { images, DNAdocuments, dateOfBirth, ...updateData } = dto;

      return await this.prisma.canine.update({
        where: { id: canineId },
        data: {
          ...updateData,
          // 2. Explicitly handle Date conversion
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          // Note: Images and Documents update logic separate thaka bhalo,
          // kintu ekhane error solve korte hole egulo data object theke exclude korte hobe.
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to update canine: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      )
        throw error;
      throw new InternalServerErrorException(
        'An error occurred while updating the canine',
      );
    }
  }

  // 5. Remove Canine
  async remove(canineId: string, userId: string, role: string) {
    try {
      const canine = await this.prisma.canine.findUnique({
        where: { id: canineId },
        select: {
          ownerId: true,
          asMother: { take: 1 },
          asFather: { take: 1 },
        },
      });

      if (!canine)
        throw new NotFoundException(`Canine with ID ${canineId} not found`);

      // Role & Ownership Check
      if (role !== 'SUPER_ADMIN' && canine.ownerId !== userId) {
        throw new ConflictException('Permission denied to delete this canine');
      }

      // Pedigree Integrity Check: If this canine is a parent of any litter
      if (canine.asMother.length > 0 || canine.asFather.length > 0) {
        throw new ConflictException(
          'Cannot delete this canine as it is linked to a litter pedigree',
        );
      }

      return await this.prisma.canine.delete({ where: { id: canineId } });
    } catch (error: any) {
      this.logger.error(`Failed to delete canine: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      )
        throw error;
      throw new InternalServerErrorException('Could not delete canine');
    }
  }

  async findMyCanines(ownerId: string, query: CanineQueryDto) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        breedId,
        breedName,
        gender,
        tier,
        color,
        status,
      } = query;

      const skip = (page - 1) * limit;

      const where: any = {
        AND: [
          { ownerId }, // Force filter by logged-in user
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { pcrId: { contains: search, mode: 'insensitive' } },
                  { microchipId: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          breedId ? { breedId } : {},
          gender ? { gender } : {},
          tier ? { tier } : {},
          status ? { status } : {},
          color ? { color: { contains: color, mode: 'insensitive' } } : {},
          breedName
            ? {
                breedRelation: {
                  name: { contains: breedName, mode: 'insensitive' },
                },
              }
            : {},
        ],
      };

      const [data, total] = await Promise.all([
        this.prisma.canine.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            breedRelation: { select: { name: true, breedCode: true } },
            owner: { select: { fullName: true, email: true, pcrId: true } },
            images: { take: 1 },
          },
        }),
        this.prisma.canine.count({ where }),
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
      this.logger.error(`Failed to fetch my canines: ${error.message}`);
      throw new InternalServerErrorException('Could not retrieve your canines');
    }
  }

  async getOwnerStats(ownerId: string) {
    try {
      // Shob count eksathe fetch korar jonno promise setup
      const [total, statsByTier, statsByStatus] = await Promise.all([
        // 1. Total Published (Approved status)
        this.prisma.canine.count({
          where: { ownerId, status: 'APPROVED' },
        }),
        // 2. Count by Tier (Gold vs Blue)
        this.prisma.canine.groupBy({
          by: ['tier'],
          where: { ownerId, status: 'APPROVED' },
          _count: { _all: true },
        }),
        // 3. Count by Status (Pending, Decline)
        this.prisma.canine.groupBy({
          by: ['status'],
          where: { ownerId },
          _count: { _all: true },
        }),
      ]);

      // Array result ke object e convert kora frontend logic simplify korar jonno
      const tierCounts = statsByTier.reduce((acc, curr) => {
        acc[curr.tier] = curr._count._all;
        return acc;
      }, {});

      const statusCounts = statsByStatus.reduce((acc, curr) => {
        acc[curr.status] = curr._count._all;
        return acc;
      }, {});

      return {
        success: true,
        data: {
          totalPublished: total || 0,
          goldVerified: tierCounts['GOLD'] || 0,
          blueVerified: tierCounts['BLUE'] || 0,
          pending: statusCounts['PENDING'] || 0,
          rejected: statusCounts['DECLINE'] || 0,
        },
      };
    } catch (error: any) {
      this.logger.error(`Error fetching owner stats: ${error.message}`);
      throw new InternalServerErrorException('Could not retrieve statistics');
    }
  }

  async getCaninesByOwnerId(targetOwnerId: string, query: CanineQueryDto) {
    try {
      // 1. Validation: Check if the owner actually exists
      const ownerExists = await this.prisma.user.findUnique({
        where: { id: targetOwnerId },
        select: { id: true, fullName: true },
      });

      if (!ownerExists) {
        throw new NotFoundException(`Owner with ID ${targetOwnerId} not found`);
      }

      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        breedId,
        gender,
        tier,
        color,
        status = 'APPROVED',
      } = query;

      const skip = (page - 1) * limit;

      const where: any = {
        AND: [
          { ownerId: targetOwnerId },
          { status }, // Validated status
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { pcrId: { contains: search, mode: 'insensitive' } },
                  { microchipId: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          breedId ? { breedId } : {},
          gender ? { gender } : {},
          tier ? { tier } : {},
          color ? { color: { contains: color, mode: 'insensitive' } } : {},
        ],
      };

      const [data, total] = await Promise.all([
        this.prisma.canine.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            breedRelation: { select: { name: true, breedCode: true } },
            owner: {
              select: {
                id: true,
                fullName: true,
                pcrId: true,
                profileImage: true,
              },
            },
            images: { take: 1 },
          },
        }),
        this.prisma.canine.count({ where }),
      ]);

      return {
        success: true,
        data,
        ownerInfo: ownerExists,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch canines for owner ${targetOwnerId}: ${error.message}`,
      );

      if (error instanceof NotFoundException) throw error;

      throw new InternalServerErrorException(
        error.message || 'Could not retrieve canines for the specified owner',
      );
    }
  }
}
