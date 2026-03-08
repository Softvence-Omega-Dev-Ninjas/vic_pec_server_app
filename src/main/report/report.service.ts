/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/main/prisma/prisma.service';
import { CreateReportDto } from './dto/report.dto';
import {
  PriorityLevel,
  ReportStatus,
  UserStatus,
} from 'generated/prisma/enums';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(private prisma: PrismaService) {}

  async createReport(userId: string | null, dto: CreateReportDto) {
    try {
      if (userId) {
        const existingReport = await this.prisma.report.findFirst({
          where: {
            reporterId: userId,
            OR: [
              { canineId: dto.canineId ? dto.canineId : undefined },
              { litterId: dto.litterId ? dto.litterId : undefined },
            ],
            status: { in: [ReportStatus.UNREAD, ReportStatus.READ] },
          },
        });

        if (existingReport) {
          throw new ConflictException(
            'You have already reported this item. Please wait for review.',
          );
        }
      }

      if (dto.canineId) {
        const canine = await this.prisma.canine.findUnique({
          where: { id: dto.canineId },
        });
        if (!canine) throw new NotFoundException('Target canine not found');
      } else if (dto.litterId) {
        const litter = await this.prisma.litter.findUnique({
          where: { id: dto.litterId },
        });
        if (!litter) throw new NotFoundException('Target litter not found');
      }

      const count = await this.prisma.report.count();
      const reportId = `REP-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

      return await this.prisma.report.create({
        data: {
          ...dto,
          reportId,
          reporterId: userId,
        },
      });
    } catch (error: any) {
      this.logger.error(`Report submission failed: ${error.message}`);
      throw error;
    }
  }

  async getReportsForAdmin(query: ReportQueryDto) {
    const { page = 1, limit = 10, status, priority } = query;
    const skip = (page - 1) * limit;

    const where = {
      status: status || undefined,
      priority: priority || undefined,
    };

    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        include: {
          canine: { select: { name: true, pcrId: true, ownerId: true } },
          litter: { select: { name: true, pcrId: true, ownerId: true } },
          reporter: { select: { fullName: true, email: true, pcrId: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSingleReport(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        canine: {
          include: {
            owner: { select: { fullName: true, email: true, pcrId: true } },
            breedRelation: { select: { name: true } },
          },
        },
        litter: {
          include: {
            owner: { select: { fullName: true, email: true, pcrId: true } },
            breedRelation: { select: { name: true } },
          },
        },
        reporter: { select: { fullName: true, email: true, pcrId: true } },
      },
    });

    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async resolveReportAction(
    reportId: string,
    status: ReportStatus,
    priority?: PriorityLevel,
    action?: 'SUSPEND_OWNER' | 'MARK_AS_RESOLVED',
  ) {
    try {
      const report = await this.prisma.report.findUnique({
        where: { id: reportId },
        include: {
          canine: { select: { ownerId: true, name: true } },
          litter: { select: { ownerId: true, name: true } },
        },
      });

      if (!report) throw new NotFoundException('Report not found');

      return await this.prisma.$transaction(async (tx) => {
        if (action === 'SUSPEND_OWNER') {
          const ownerId = report.canine?.ownerId || report.litter?.ownerId;

          if (!ownerId) {
            throw new BadRequestException(
              'No owner found associated with this report',
            );
          }

          await tx.user.update({
            where: { id: ownerId },
            data: { status: UserStatus.SUSPENDED },
          });

          await tx.canine.updateMany({
            where: { ownerId: ownerId },
            data: { status: 'UNDER_REVIEW' },
          });
        }

        return await tx.report.update({
          where: { id: reportId },
          data: {
            status,
            priority: priority || report.priority,
          },
        });
      });
    } catch (error: any) {
      this.logger.error(`Error resolving report: ${error.message}`);
      throw error;
    }
  }
}
