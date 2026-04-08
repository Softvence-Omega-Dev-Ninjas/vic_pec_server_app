/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// admin-litter/admin-litter.service.ts
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  //   BadRequestException,
  Logger,
} from '@nestjs/common';

import {
  AdminLitterQueryDto,
  UpdateLitterAdminDto,
} from './dto/admin-litter.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminLitterService {
  private readonly logger = new Logger(AdminLitterService.name);

  constructor(private prisma: PrismaService) {}

  async getAllLitters(query: AdminLitterQueryDto) {
    const { page, limit, search, tier, status, sortBy, sortOrder } = query;
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
        tier ? { tier } : {},
        status ? { status } : {},
      ],
    };

    try {
      const [data, total] = await Promise.all([
        this.prisma.litter.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            owner: { select: { fullName: true, email: true, pcrId: true } },
            breedRelation: { select: { name: true, breedCode: true } },
            mother: { select: { name: true, pcrId: true } },
            father: { select: { name: true, pcrId: true } },
            _count: { select: { puppies: true } },
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
      this.logger.error(`Failed to fetch litters: ${error}`);
      throw new InternalServerErrorException('Failed to fetch litters');
    }
  }

  async getLitterById(id: string) {
    const litter = await this.prisma.litter.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            fullName: true,
            email: true,
            pcrId: true,
          },
        },
        breedRelation: true,
        // Parents-er basic info include kora bhalo
        mother: {
          select: {
            id: true,
            pcrId: true,
            name: true,
          },
        },
        father: {
          select: {
            id: true,
            pcrId: true,
            name: true,
          },
        },
        // Puppies-er list thikmoto anar jonno select use korte paro
        puppies: {
          select: {
            id: true,
            pcrId: true,
            name: true,
            gender: true,
            color: true,
            status: true,
            tier: true,
          },
        },
        images: true,
        DNAdocuments: true,
      },
    });

    if (!litter) {
      throw new NotFoundException('Litter record not found');
    }

    return {
      success: true,
      data: litter,
    };
  }

  async updateLitter(id: string, dto: UpdateLitterAdminDto) {
    const currentLitter = await this.prisma.litter.findUnique({
      where: { id },
      include: { puppies: true },
    });

    if (!currentLitter) throw new NotFoundException('Litter record not found');

    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Manually map fields to avoid "Unknown argument" error
        // Database-e thaka fields gulo shudhu ekhane thakbe
        const updateData: any = {
          name: dto.name,
          status: dto.status,
          tier: dto.tier,
          city: dto.city,
          state: dto.state,
          zipCode: dto.zipCode,
          country: dto.country,
          healthStatus: dto.healthStatus,
        };
        // Date fix
        if (dto.dateOfBirth) {
          updateData.dateOfBirth = new Date(dto.dateOfBirth);
        }

        // 2. Date object convert
        if (dto.dateOfBirth) {
          updateData.dateOfBirth = new Date(dto.dateOfBirth);
        }

        // 3. Logic for Tier change and PCR ID regeneration
        if (dto.tier && dto.tier !== currentLitter.tier) {
          const breedCode = currentLitter.pcrBreedCode;
          const generation = currentLitter.generation;

          const lastLitter = await tx.litter.findFirst({
            where: { pcrBreedCode: breedCode, generation: generation },
            orderBy: { pcrIncremental: 'desc' },
          });

          const nextInc = lastLitter
            ? parseInt(lastLitter.pcrIncremental) + 1
            : 1;
          const pcrIncremental = nextInc.toString().padStart(5, '0');
          const pcrRandom = Math.floor(
            100000 + Math.random() * 900000,
          ).toString();

          const newLitterPcrId = `PCR-L${breedCode}-${generation}-${pcrIncremental}-${pcrRandom}`;

          // Add generated fields to update object
          updateData.pcrId = newLitterPcrId;
          updateData.pcrIncremental = pcrIncremental;
          updateData.pcrRandom = pcrRandom;

          // 4. Update Puppies PCR IDs & Tier (Cascade)
          const pupPrefix = dto.tier === 'GOLD' ? 'G' : 'B';

          for (const [idx, pup] of currentLitter.puppies.entries()) {
            const pupInc = (nextInc + idx).toString().padStart(5, '0');
            const pupRand = Math.floor(
              100000 + Math.random() * 900000,
            ).toString();
            const newPupPcrId = `PCR-${pupPrefix}${breedCode}-${generation}-${pupInc}-${pupRand}`;

            await tx.canine.update({
              where: { id: pup.id },
              data: {
                pcrId: newPupPcrId,
                tier: dto.tier,
                pcrPrefix: pupPrefix,
                pcrIncremental: pupInc,
                pcrRandom: pupRand,
                status: dto.status || pup.status,
              },
            });
          }
        } else if (dto.status) {
          // 5. Sync only status if tier hasn't changed
          await tx.canine.updateMany({
            where: { litterId: id },
            data: { status: dto.status },
          });
        }

        // 6. Final update without extra DTO fields
        const updated = await tx.litter.update({
          where: { id },
          data: updateData,
        });

        return {
          success: true,
          data: updated,
          message: dto.tier
            ? `Litter and ${currentLitter.puppies.length} puppies updated with new PCR IDs.`
            : 'Litter updated successfully',
        };
      });
    } catch (error: any) {
      this.logger.error(`Update operation failed: ${error.message}`);
      throw new InternalServerErrorException('Update operation failed');
    }
  }

  async deleteLitter(id: string) {
    const litter = await this.prisma.litter.findUnique({ where: { id } });
    if (!litter) throw new NotFoundException('Litter record not found');

    try {
      await this.prisma.litter.delete({ where: { id } });
      return { success: true, message: 'Litter deleted successfully' };
    } catch (error) {
      this.logger.error(`Delete operation failed: ${error}`);
      throw new InternalServerErrorException('Delete operation failed');
    }
  }
}
