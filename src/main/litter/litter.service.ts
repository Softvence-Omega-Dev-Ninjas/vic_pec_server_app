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
} from '@nestjs/common';
import { PrismaService } from 'src/main/prisma/prisma.service';
// import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { CreateLitterDto, UpdateLitterDto } from './dto/create-litter.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { LitterQueryDto } from './dto/LitterQueryDto';
import { RegistryTier } from 'generated/prisma/enums';

@Injectable()
export class LitterService {
  private readonly logger = new Logger(LitterService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

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

      if (!breed) throw new NotFoundException('Selected breed not found');

      const pcrBreedCode = breed.breedCode;

      if (breed.type === 'DESIGNER' && dto.generation !== 'F1') {
        const parentPcrIds = [dto.motherPcrId, dto.fatherPcrId].filter(Boolean);

        const f1Ancestor = await this.prisma.canine.findFirst({
          where: {
            pcrId: { in: parentPcrIds as any },
            generation: 'F1',
          },
        });

        if (dto.motherPcrId || dto.fatherPcrId) {
          const parentPcrIds = [dto.motherPcrId, dto.fatherPcrId].filter(
            Boolean,
          ) as string[];

          const parents = await this.prisma.canine.findMany({
            where: { pcrId: { in: parentPcrIds } },
            select: { pcrId: true, gender: true },
          });

          parents.forEach((parent) => {
            if (
              parent.pcrId === dto.motherPcrId &&
              parent.gender !== 'FEMALE'
            ) {
              throw new BadRequestException(
                `Canine ${parent.pcrId} is not a Female and cannot be a mother`,
              );
            }
            if (parent.pcrId === dto.fatherPcrId && parent.gender !== 'MALE') {
              throw new BadRequestException(
                `Canine ${parent.pcrId} is not a Male and cannot be a father`,
              );
            }
          });

          // 3. Designer breed ancestor check (F1 validation)
          if (breed.type === 'DESIGNER' && dto.generation !== 'F1') {
            const f1Ancestor = await this.prisma.canine.findFirst({
              where: {
                pcrId: { in: parentPcrIds },
                generation: 'F1',
              },
            });

            if (!f1Ancestor && parentPcrIds.length > 0) {
              throw new BadRequestException(
                'Registration rejected: Later generations must trace back to a registered F1 ancestor',
              );
            }
          }
        }

        if (!f1Ancestor && parentPcrIds.length > 0) {
          throw new BadRequestException(
            'Registration rejected: Any later generations (F1B, F2, VD) must trace back to a registered F1 ancestor',
          );
        }
      }

      // ৩. PCR ID Generation (Prefix 'L' for Litter)
      const lastLitter = await this.prisma.litter.findFirst({
        where: { pcrBreedCode, generation: dto.generation },
        orderBy: { pcrIncremental: 'desc' },
      });

      const nextInc = lastLitter ? parseInt(lastLitter.pcrIncremental) + 1 : 1;
      const pcrIncremental = nextInc.toString().padStart(5, '0');
      const pcrRandom = Math.floor(100000 + Math.random() * 900000).toString();

      // Format: PCR-L301-F1B-00001-123456
      const pcrId = `PCR-L${pcrBreedCode}-${dto.generation}-${pcrIncremental}-${pcrRandom}`;

      const tier =
        breed.type === 'DESIGNER' ? RegistryTier.GOLD : RegistryTier.BLUE;

      const [imageUrlList, docUrlList] = await Promise.all([
        this.cloudinary.uploadImages(images),
        this.cloudinary.uploadImages(docs),
      ]);

      return await this.prisma.$transaction(async (tx) => {
        if (dto.microchipId) {
          const existing = await tx.litter.findUnique({
            where: { microchipId: dto.microchipId },
          });
          if (existing)
            throw new ConflictException('Microchip ID already exists');
        }

        return await tx.litter.create({
          data: {
            ...dto,
            pcrId,
            pcrPrefix: 'L',
            pcrBreedCode,
            pcrIncremental,
            pcrRandom,
            tier,
            dateOfBirth: new Date(dto.dateOfBirth),
            ownerId: userId,
            images: {
              create: (imageUrlList as any)
                .filter((img: any) => img?.url && img?.publicId)
                .map((img: any) => ({
                  url: img.url,
                  publicId: img.publicId,
                })),
            },

            DNAdocuments: {
              create: docUrlList.map((doc: any) => ({
                url: doc.url,
                publicId: doc.publicId,
              })),
            },
          },
          include: {
            images: true,
            DNAdocuments: true,
            mother: true,
            father: true,
          },
        });
      });
    } catch (error: any) {
      this.logger.error(`Litter creation failed: ${error.message}`);
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Error occurred while creating litter',
      );
    }
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
  async update(litterId: string, dto: UpdateLitterDto) {
    try {
      // Existence check
      await this.findOne(litterId);

      // Microchip unique check jodi update e thake
      if (dto.microchipId) {
        const existing = await this.prisma.litter.findFirst({
          where: {
            microchipId: dto.microchipId,
            id: { not: litterId },
          },
        });
        if (existing)
          throw new ConflictException(
            'Microchip ID already in use by another litter',
          );
      }

      return await this.prisma.litter.update({
        where: { id: litterId },
        data: {
          ...dto,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        },
        include: {
          images: true,
          DNAdocuments: true,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to update litter: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      )
        throw error;
      throw new InternalServerErrorException(
        'An error occurred while updating the litter',
      );
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
