/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// admin-canine/admin-canine.service.ts
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/main/prisma/prisma.service';
import {
  AdminCanineQueryDto,
  UpdateCanineAdminDto,
} from './dto/admin-canine-query.dto';

@Injectable()
export class AdminCanineService {
  constructor(private prisma: PrismaService) {}

  async getAllCanines(query: AdminCanineQueryDto) {
    const { page, limit, search, gender, tier, status, sortBy, sortOrder } =
      query;
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
        gender ? { gender } : {},
        tier ? { tier } : {},
        status ? { status } : {},
      ],
    };

    try {
      const [data, total] = await Promise.all([
        this.prisma.canine.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            owner: { select: { fullName: true, email: true, pcrId: true } },
            breedRelation: { select: { name: true, breedCode: true } },
            images: { where: { isPrimary: true }, take: 1 },
          },
        }),
        this.prisma.canine.count({ where }),
      ]);

      return {
        success: true,
        data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Failed to fetch canines');
    }
  }

  async getCanineById(id: string) {
    const canine = await this.prisma.canine.findUnique({
      where: { id },
      include: {
        owner: true,
        breedRelation: true,
        images: true,
        DNAdocuments: true,
        litter: { include: { breedRelation: true } },
        asMother: { take: 5 },
        asFather: { take: 5 },
      },
    });

    if (!canine) throw new NotFoundException('Canine record not found');
    return { success: true, data: canine };
  }

  async updateCanine(id: string, dto: UpdateCanineAdminDto) {
    const currentCanine = await this.prisma.canine.findUnique({
      where: { id },
      include: { breedRelation: true },
    });

    if (!currentCanine) {
      throw new NotFoundException('Canine record not found');
    }

    try {
      let updateData: any = { ...dto };

      if (dto.tier && dto.tier !== currentCanine.tier) {
        const newPrefix = dto.tier === 'GOLD' ? 'G' : 'B';
        const breedCode = currentCanine.pcrBreedCode;
        const lastCanine = await this.prisma.canine.findFirst({
          where: {
            pcrPrefix: newPrefix,
            pcrBreedCode: breedCode,
          },
          orderBy: { pcrIncremental: 'desc' },
        });

        const nextInc = lastCanine
          ? parseInt(lastCanine.pcrIncremental) + 1
          : 1;
        const pcrIncremental = nextInc.toString().padStart(5, '0');
        const pcrRandom = Math.floor(
          100000 + Math.random() * 900000,
        ).toString();

        const newPcrId = `PCR-${newPrefix}${breedCode}-${pcrIncremental}-${pcrRandom}`;

        updateData = {
          ...updateData,
          pcrId: newPcrId,
          pcrPrefix: newPrefix,
          pcrIncremental,
          pcrRandom,
        };
      }
      const updated = await this.prisma.canine.update({
        where: { id },
        data: updateData,
      });

      return {
        success: true,
        data: updated,
        message: dto.tier
          ? `Canine updated with new PCR ID: ${updated.pcrId}`
          : 'Canine updated successfully',
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Update operation failed');
    }
  }
  async deleteCanine(id: string) {
    await this.getCanineById(id);
    try {
      await this.prisma.canine.delete({ where: { id } });
      return { success: true, message: 'Canine deleted successfully' };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Delete operation failed');
    }
  }
}
