/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/main/prisma/prisma.service';
import { CreateBreedDto, UpdateBreedDto } from './dto/create-breed.dto';
import { BreedQueryDto } from './dto/BreedQueryDto';

@Injectable()
export class BreedService {
  private readonly logger = new Logger(BreedService.name);

  constructor(private prisma: PrismaService) {}

  // 1. Create Breed
  async create(dto: CreateBreedDto) {
    try {
      const existing = await this.prisma.breed.findUnique({
        where: { breedCode: dto.breedCode },
      });

      if (existing) {
        throw new ConflictException(
          `Breed with code ${dto.breedCode} already exists`,
        );
      }

      return await this.prisma.breed.create({
        data: {
          breedCode: dto.breedCode,
          name: dto.name,
          acronym: dto.acronym,
          type: dto.type,
          tierEligibility: dto.tierEligibility,
          eligibleGen: dto.eligibleGen,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to create breed: ${error.message}`);
      if (error instanceof ConflictException) throw error;
      throw new InternalServerErrorException(
        'An unexpected error occurred while creating the breed',
      );
    }
  }

  // 2. Get All Breeds
  async findAll() {
    try {
      return await this.prisma.breed.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { canines: true, litters: true },
          },
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to fetch breeds: ${error.message}`);
      throw new InternalServerErrorException(
        'Could not retrieve breeds at this time',
      );
    }
  }

  // 3. Get Single Breed
  async findOne(id: string) {
    try {
      const breed = await this.prisma.breed.findUnique({
        where: { id },
        include: {
          _count: {
            select: { canines: true, litters: true },
          },
        },
      });

      if (!breed) {
        throw new NotFoundException(`Breed with ID ${id} not found`);
      }

      return breed;
    } catch (error: any) {
      this.logger.error(`Failed to find breed: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error searching for the breed');
    }
  }

  // 4. Update Breed
  async update(id: string, dto: UpdateBreedDto) {
    try {
      // Check if breed exists first
      await this.findOne(id);

      // Check if breedCode is being changed to an already existing one
      if (dto.breedCode) {
        const existing = await this.prisma.breed.findFirst({
          where: {
            breedCode: dto.breedCode,
            id: { not: id },
          },
        });
        if (existing)
          throw new ConflictException('New breed code is already in use');
      }

      return await this.prisma.breed.update({
        where: { id },
        data: dto,
      });
    } catch (error: any) {
      this.logger.error(`Failed to update breed: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      )
        throw error;
      throw new InternalServerErrorException('Failed to update breed details');
    }
  }

  // 5. Delete Breed
  async remove(id: string) {
    try {
      await this.findOne(id);

      // 2. Relations check with null safety
      const relations = await this.prisma.breed.findUnique({
        where: { id },
        select: {
          _count: {
            select: { canines: true, litters: true },
          },
        },
      });

      if (
        relations &&
        (relations._count.canines > 0 || relations._count.litters > 0)
      ) {
        throw new ConflictException(
          'Cannot delete breed with existing canines or litters',
        );
      }

      // 3. Delete the breed
      return await this.prisma.breed.delete({
        where: { id },
      });
    } catch (error: any) {
      this.logger.error(`Failed to delete breed: ${error.message}`);

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Could not delete breed');
    }
  }

  async findAllWithPagination(query: BreedQueryDto) {
    try {
      const { page = 1, limit = 10, search, sortBy, sortOrder } = query;
      const skip = (page - 1) * limit;

      // Filter logic: Search by name, breedCode or acronym
      const where: any = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { breedCode: { contains: search, mode: 'insensitive' } },
              { acronym: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

      const [data, total] = await Promise.all([
        this.prisma.breed.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy || 'name']: sortOrder || 'asc' },
          include: {
            _count: {
              select: { canines: true, litters: true },
            },
          },
        }),
        this.prisma.breed.count({ where }),
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
      this.logger.error(`Failed to fetch breeds: ${error.message}`);
      throw new InternalServerErrorException(
        'Could not retrieve breeds with pagination',
      );
    }
  }
}
