import { Module } from '@nestjs/common';
// import { StatsAndTireController } from './stats-and-tire.controller';
import { StatsAndTireService } from './stats-and-tire.service';
import { AdminStatsAndTireController } from './stats-and-tire.controller';

import { PermissionService } from '../permission/permission.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionGuard } from '../../../guard/permission.guard';

@Module({
  controllers: [AdminStatsAndTireController],
  providers: [
    StatsAndTireService,
    PrismaService,
    PermissionGuard,
    PermissionService,
  ],
  exports: [PermissionService, PermissionGuard],
})
export class StatsAndTireModule {}
