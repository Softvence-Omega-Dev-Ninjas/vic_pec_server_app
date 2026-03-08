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
// import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { CreateLitterDto, UpdateLitterDto } from './dto/create-litter.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { LitterQueryDto } from './dto/LitterQueryDto';

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
      const lastLitter = await this.prisma.litter.findFirst({
        where: {
          pcrBreedCode: dto.pcrBreedCode,
          generation: dto.generation,
        },
        orderBy: { pcrIncremental: 'desc' },
      });

      const nextInc = lastLitter ? parseInt(lastLitter.pcrIncremental) + 1 : 1;
      const pcrIncremental = nextInc.toString().padStart(5, '0');
      const pcrRandom = Math.floor(100000 + Math.random() * 900000).toString();

      const pcrId = `PCR-L${dto.pcrBreedCode}-${dto.generation}-${pcrIncremental}-${pcrRandom}`;

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
            pcrId,
            pcrPrefix: 'L',
            pcrBreedCode: dto.pcrBreedCode,
            generation: dto.generation,
            pcrIncremental,
            pcrRandom,
            name: dto.name,
            gender: dto.gender,
            dateOfBirth: new Date(dto.dateOfBirth),
            color: dto.color,
            weight: dto.weight,
            city: dto.city,
            state: dto.state,
            zipCode: dto.zipCode,
            country: dto.country,
            microchipId: dto.microchipId,
            breedId: dto.breedId,
            ownerId: userId,
            motherPcrId: dto.motherPcrId,
            fatherPcrId: dto.fatherPcrId,

            images: {
              create: (imageUrlList as any).map((url: any) => ({ url })),
            },
            DNAdocuments: {
              create: (docUrlList as any).map((url: any) => ({
                url,
                name: 'Litter DNA Document',
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
      if (error instanceof ConflictException) throw error;
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

  async findOne(litterId: string) {
    try {
      const litter = await this.prisma.litter.findUnique({
        where: { id: litterId },
        include: {
          images: true,
          DNAdocuments: true,
          mother: true,
          father: true,
          breedRelation: true,
          owner: { select: { fullName: true, email: true } },
          puppies: true,
          _count: { select: { puppies: true } },
        },
      });

      if (!litter) {
        throw new NotFoundException(`Litter with ID ${litterId} not found`);
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
}
