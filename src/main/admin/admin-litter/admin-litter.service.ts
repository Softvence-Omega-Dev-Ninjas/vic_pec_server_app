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
import { PrismaService } from 'src/main/prisma/prisma.service';
import {
  AdminLitterQueryDto,
  UpdateLitterAdminDto,
} from './dto/admin-litter.dto';

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
        owner: { select: { fullName: true, email: true, pcrId: true } },
        breedRelation: true,
        mother: true,
        father: true,
        puppies: true,
        images: true,
        DNAdocuments: true,
      },
    });

    if (!litter) throw new NotFoundException('Litter record not found');
    return { success: true, data: litter };
  }

  async updateLitter(id: string, dto: UpdateLitterAdminDto) {
    const currentLitter = await this.prisma.litter.findUnique({
      where: { id },
      include: { breedRelation: true },
    });

    if (!currentLitter) throw new NotFoundException('Litter record not found');

    try {
      let updateData: any = { ...dto };

      // Logic for Tier change and PCR ID regeneration for Litters
      if (dto.tier && dto.tier !== currentLitter.tier) {
        const breedCode = currentLitter.pcrBreedCode;
        const generation = currentLitter.generation;

        const lastLitter = await this.prisma.litter.findFirst({
          where: {
            pcrBreedCode: breedCode,
            generation: generation,
          },
          orderBy: { pcrIncremental: 'desc' },
        });

        const nextInc = lastLitter
          ? parseInt(lastLitter.pcrIncremental) + 1
          : 1;
        const pcrIncremental = nextInc.toString().padStart(5, '0');
        const pcrRandom = Math.floor(
          100000 + Math.random() * 900000,
        ).toString();

        // Litter PCR Format: PCR-L{BreedCode}-{Gen}-{Inc}-{Random}
        const newPcrId = `PCR-L${breedCode}-${generation}-${pcrIncremental}-${pcrRandom}`;

        updateData = {
          ...updateData,
          pcrId: newPcrId,
          pcrIncremental,
          pcrRandom,
        };
      }

      const updated = await this.prisma.litter.update({
        where: { id },
        data: updateData,
      });

      return {
        success: true,
        data: updated,
        message: dto.tier
          ? `Litter updated with new PCR ID: ${updated.pcrId}`
          : 'Litter updated successfully',
      };
    } catch (error) {
      this.logger.error(`Update operation failed: ${error}`);
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
