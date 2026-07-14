import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { DASHBOARD_CACHE_KEY } from './dashboard-cache.constants';

interface StatusCountRow {
  contract_status: string;
  count: number;
}

interface PaymentMethodCountRow {
  payment_method: string;
  count: number;
}

interface DailyRow {
  day: string;
  count: number;
  total_amount: number;
}

interface GlobalMetricsRow {
  total_contracts: number;
  total_revenue: number;
  total_investment: number;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getSummary(): Promise<DashboardSummaryDto> {
    const cached =
      await this.cache.get<DashboardSummaryDto>(DASHBOARD_CACHE_KEY);
    if (cached) {
      return cached;
    }

    const summary = await this.buildSummary();

    const ttlSeconds =
      this.configService.get<number>('cache.dashboardTtlSeconds') ?? 60;
    await this.cache.set(DASHBOARD_CACHE_KEY, summary, ttlSeconds * 1000);

    return summary;
  }

  private async buildSummary(): Promise<DashboardSummaryDto> {
    const [
      contractStatusCounts,
      paymentMethodCounts,
      dailySales,
      dailyPurchases,
      recentActivity,
      vehicleCounts,
      globalMetrics,
    ] = await Promise.all([
      this.getContractStatusCounts(),
      this.getPaymentMethodCounts(),
      this.getDailyBuckets('SALE'),
      this.getDailyBuckets('PURCHASE'),
      this.getRecentActivity(),
      this.getVehicleCounts(),
      this.getGlobalMetrics(),
    ]);

    return {
      generatedAt: new Date(),
      contractStatusCounts,
      paymentMethodCounts,
      dailySales,
      dailyPurchases,
      recentActivity,
      vehicleCounts,
      globalMetrics,
    };
  }

  private async getContractStatusCounts(): Promise<Record<string, number>> {
    const rows = await this.prisma.$queryRaw<StatusCountRow[]>(Prisma.sql`
      SELECT contract_status, count(*)::int AS count
      FROM purchase_sales
      GROUP BY contract_status
    `);
    return Object.fromEntries(
      rows.map((row) => [row.contract_status, row.count]),
    );
  }

  private async getPaymentMethodCounts(): Promise<Record<string, number>> {
    const rows = await this.prisma.$queryRaw<
      PaymentMethodCountRow[]
    >(Prisma.sql`
      SELECT payment_method, count(*)::int AS count
      FROM purchase_sales
      GROUP BY payment_method
    `);
    return Object.fromEntries(
      rows.map((row) => [row.payment_method, row.count]),
    );
  }

  /**
   * Buckets are grouped by raw UTC calendar day (no timezone conversion) to
   * keep the server/DB strictly UTC, per project convention. Month-level (or
   * any other local-timezone) aggregation is the consumer's responsibility:
   * the frontend converts each `day` to America/Bogota before grouping.
   */
  private async getDailyBuckets(
    contractType: 'SALE' | 'PURCHASE',
  ): Promise<{ day: string; count: number; totalAmount: number }[]> {
    const priceColumn =
      contractType === 'SALE' ? 'sale_price' : 'purchase_price';
    const rows = await this.prisma.$queryRaw<DailyRow[]>(Prisma.sql`
      SELECT
        to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
        count(*)::int AS count,
        COALESCE(sum(${Prisma.raw(priceColumn)}), 0)::float8 AS total_amount
      FROM purchase_sales
      WHERE contract_type = ${contractType}
        AND contract_status = 'COMPLETED'
        AND created_at >= (now() - interval '12 months')
      GROUP BY 1
      ORDER BY 1
    `);
    return rows.map((row) => ({
      day: row.day,
      count: row.count,
      totalAmount: row.total_amount,
    }));
  }

  private async getRecentActivity() {
    const rows = await this.prisma.purchaseSale.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return rows.map((row) => ({
      contractId: row.id,
      contractType: row.contractType,
      contractStatus: row.contractStatus,
      amount: (row.contractType === 'SALE'
        ? row.salePrice
        : row.purchasePrice
      ).toNumber(),
      createdAt: row.createdAt,
    }));
  }

  private async getVehicleCounts() {
    const [totalCars, availableCars, totalMotorcycles, availableMotorcycles] =
      await Promise.all([
        this.prisma.vehicle.count({ where: { type: 'CAR' } }),
        this.prisma.vehicle.count({
          where: { type: 'CAR', status: 'AVAILABLE' },
        }),
        this.prisma.vehicle.count({ where: { type: 'MOTORCYCLE' } }),
        this.prisma.vehicle.count({
          where: { type: 'MOTORCYCLE', status: 'AVAILABLE' },
        }),
      ]);
    return { totalCars, availableCars, totalMotorcycles, availableMotorcycles };
  }

  private async getGlobalMetrics() {
    const [row] = await this.prisma.$queryRaw<GlobalMetricsRow[]>(Prisma.sql`
      SELECT
        (SELECT count(*)::int FROM purchase_sales) AS total_contracts,
        (SELECT COALESCE(sum(sale_price), 0)::float8 FROM purchase_sales
          WHERE contract_type = 'SALE' AND contract_status = 'COMPLETED') AS total_revenue,
        (SELECT COALESCE(sum(purchase_price), 0)::float8 FROM purchase_sales
          WHERE contract_type = 'PURCHASE' AND contract_status IN ('ACTIVE', 'COMPLETED')) AS total_investment
    `);
    return {
      totalContracts: row.total_contracts,
      totalRevenue: row.total_revenue,
      totalInvestment: row.total_investment,
    };
  }
}
