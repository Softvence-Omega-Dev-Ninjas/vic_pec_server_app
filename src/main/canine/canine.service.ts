/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/main/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { RegisterCanineDto, UpdateCanineDto } from './dto/create-canine.dto';
import { CanineQueryDto } from './dto/canine-query.dto';

@Injectable()
export class CanineService {
  private readonly logger = new Logger(CanineService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  // 1. Register Canine
  async registerCanine(
    userId: string,
    dto: RegisterCanineDto,
    images: Express.Multer.File[],
    docs: Express.Multer.File[],
  ) {
    try {
      // ১. PCR ID Generation Logic (Transaction এর বাইরে রাখা ঠিক আছে)
      const lastCanine = await this.prisma.canine.findFirst({
        where: { pcrPrefix: dto.pcrPrefix, pcrBreedCode: dto.pcrBreedCode },
        orderBy: { pcrIncremental: 'desc' },
      });

      const nextInc = lastCanine ? parseInt(lastCanine.pcrIncremental) + 1 : 1;
      const pcrIncremental = nextInc.toString().padStart(5, '0');
      const pcrRandom = Math.floor(100000 + Math.random() * 900000).toString();
      const pcrId = `PCR-${dto.pcrPrefix}${dto.pcrBreedCode}-${pcrIncremental}-${pcrRandom}`;

      // ২. Media Upload (এটা ট্রানজ্যাকশনের বাইরেই থাকতে হবে)
      const [imageUrlList, docUrlList] = await Promise.all([
        this.cloudinary.uploadImages(images),
        this.cloudinary.uploadImages(docs),
      ]);

      // ৩. Database Transaction
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.canine.findUnique({
          where: { microchipId: dto.microchipId },
        });

        if (existing) {
          throw new ConflictException(
            'Microchip ID already exists in our records',
          );
        }

        return await tx.canine.create({
          data: {
            ...dto,
            dateOfBirth: new Date(dto.dateOfBirth),
            pcrId,
            pcrIncremental,
            pcrRandom,
            ownerId: userId,
            images: {
              create: (imageUrlList as any).map((url: any) => ({ url })),
            },
            DNAdocuments: {
              create: (docUrlList as any).map((url: any) => ({
                url,
                name: 'Canine DNA Report',
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
    } catch (error: any) {
      this.logger.error(`Canine registration failed: ${error.message}`);

      if (error instanceof ConflictException) throw error;

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
        gender,
      } = query;
      const skip = (page - 1) * limit;

      const where: any = {
        AND: [
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
            owner: { select: { fullName: true, email: true, pcrId: true } },
            images: { take: 1 }, // লিস্টের জন্য শুধু প্রথম ইমেজটা নেয়া হচ্ছে পারফরম্যান্সের জন্য
          },
        }),
        this.prisma.canine.count({ where }),
      ]);

      return {
        success: true,
        data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch canines: ${error.message}`);
      throw new InternalServerErrorException('Could not retrieve canines');
    }
  }

  // 3. Find One Canine
  async findOne(canineId: string) {
    try {
      const canine = await this.prisma.canine.findUnique({
        where: { id: canineId },
        include: {
          images: true,
          DNAdocuments: true,
          breedRelation: true,
          owner: { select: { fullName: true, email: true, pcrId: true } },
          litter: { include: { breedRelation: true } },
          asMother: { select: { id: true, pcrId: true } },
          asFather: { select: { id: true, pcrId: true } },
        },
      });

      if (!canine)
        throw new NotFoundException(`Canine with ID ${canineId} not found`);
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

      // Ownership Check: Only Owner or Admin can update
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

      return await this.prisma.canine.update({
        where: { id: canineId },
        data: {
          ...dto,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
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
}
