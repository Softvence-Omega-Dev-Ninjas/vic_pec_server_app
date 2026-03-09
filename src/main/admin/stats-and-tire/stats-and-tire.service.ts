/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';

import { PrismaService } from 'src/main/prisma/prisma.service';
import { UpdateRegistryTierDto } from './dto/assign-tire.dto';
import { RegistryTier } from 'generated/prisma/enums';

@Injectable()
export class StatsAndTireService {
  private readonly logger = new Logger(StatsAndTireService.name);

  constructor(private prisma: PrismaService) {}

  async updateCanineTier(canineId: string, dto: UpdateRegistryTierDto) {
    try {
      const canine = await this.prisma.canine.findUnique({
        where: { id: canineId },
      });

      if (!canine) throw new NotFoundException('Canine not found');

      const newPrefix = dto.tier === RegistryTier.GOLD ? 'G' : 'B';

      let newPcrId = canine.pcrId;
      if (canine.pcrPrefix !== newPrefix) {
        newPcrId = `PCR-${newPrefix}${canine.pcrBreedCode}-${canine.pcrIncremental}-${canine.pcrRandom}`;
      }

      return await this.prisma.canine.update({
        where: { id: canineId },
        data: {
          tier: dto.tier,
          pcrPrefix: newPrefix,
          pcrId: newPcrId,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to update canine tier: ${error.message}`);
      throw error;
    }
  }

  async updateLitterTier(litterId: string, dto: UpdateRegistryTierDto) {
    try {
      const litter = await this.prisma.litter.findUnique({
        where: { id: litterId },
      });

      if (!litter) throw new NotFoundException('Litter not found');

      return await this.prisma.litter.update({
        where: { id: litterId },
        data: { tier: dto.tier },
      });
    } catch (error: any) {
      this.logger.error(`Failed to update litter tier: ${error.message}`);
      throw error;
    }
  }
}
