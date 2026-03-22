// admin-stats.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/main/prisma/prisma.service';

@Injectable()
export class AdminStatsService {
  constructor(private prisma: PrismaService) {}
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      return d;
    }).reverse();

    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      unverifiedUsers, // Email verify koreni emon user
      totalDogs,
      goldDogs,
      blueDogs,
      pendingCanines,
      approvedToday,
      totalLitters,
      goldLitters,
      blueLitters,
      pendingLitters,
      totalReports,
      unreadReports,
      pendingCerts,
      pendingTransfers,
      //   activeSubs,
      ...chartQueries
    ] = await Promise.all([
      // --- USER STATS ---
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { status: 'PENDING' } }),
      this.prisma.user.count({ where: { isVerified: false } }),

      // --- CANINE STATS ---
      this.prisma.canine.count(),
      this.prisma.canine.count({ where: { tier: 'GOLD' } }),
      this.prisma.canine.count({ where: { tier: 'BLUE' } }), // NONE = Blue
      this.prisma.canine.count({ where: { status: 'PENDING' } }),
      this.prisma.canine.count({
        where: { status: 'APPROVED', updatedAt: { gte: today } },
      }),

      // --- LITTER STATS ---
      this.prisma.litter.count(),
      this.prisma.litter.count({ where: { tier: 'GOLD' } }),
      this.prisma.litter.count({ where: { tier: 'BLUE' } }), // NONE = Blue
      this.prisma.litter.count({ where: { status: 'PENDING' } }),

      // --- OTHERS ---
      this.prisma.report.count(),
      this.prisma.report.count({ where: { status: 'UNREAD' } }),
      this.prisma.certificateRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.ownershipTransfer.count({ where: { status: 'PENDING' } }),
      this.prisma.subscription.count({ where: { status: 'active' } }),

      // --- CHART DATA ---
      ...last7Days.map((date) =>
        this.prisma.user.count({
          where: {
            createdAt: { gte: date, lt: new Date(date.getTime() + 86400000) },
          },
        }),
      ),
      ...last7Days.map((date) =>
        this.prisma.canine.count({
          where: {
            createdAt: { gte: date, lt: new Date(date.getTime() + 86400000) },
          },
        }),
      ),
    ]);

    const formattedChartData = last7Days.map((date, index) => ({
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      users: chartQueries[index],
      dogs: chartQueries[index + 7],
    }));

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        pending: pendingUsers,
        unverified: unverifiedUsers,
      },
      canines: {
        total: totalDogs,
        gold: goldDogs,
        blue: blueDogs,
        pending: pendingCanines,
        approvedToday,
      },
      litters: {
        total: totalLitters,
        gold: goldLitters,
        blue: blueLitters,
        pending: pendingLitters,
      },
      reports: { total: totalReports, unread: unreadReports },
      requests: {
        certificates: pendingCerts,
        transfers: pendingTransfers,
        totalPendingActions:
          pendingCanines + pendingLitters + pendingCerts + pendingTransfers,
      },
      chartData: formattedChartData,
    };
  }
}
