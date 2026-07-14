import { ApiProperty } from '@nestjs/swagger';
import { ContractType, ContractStatus } from '@prisma/client';

export class DailyBucketDto {
  @ApiProperty({ example: '2026-06-15' }) day!: string;
  @ApiProperty({ example: 5 }) count!: number;
  @ApiProperty({ example: 320000000 }) totalAmount!: number;
}

export class RecentActivityItemDto {
  @ApiProperty({ example: 1 }) contractId!: number;
  @ApiProperty({ enum: ContractType, example: ContractType.SALE })
  contractType!: ContractType;
  @ApiProperty({ enum: ContractStatus, example: ContractStatus.COMPLETED })
  contractStatus!: ContractStatus;
  @ApiProperty({ example: 75000000 }) amount!: number;
  @ApiProperty({ example: '2026-06-15T09:30:00.000Z' }) createdAt!: Date;
}

export class VehicleCountsDto {
  @ApiProperty({ example: 80 }) totalCars!: number;
  @ApiProperty({ example: 60 }) availableCars!: number;
  @ApiProperty({ example: 40 }) totalMotorcycles!: number;
  @ApiProperty({ example: 35 }) availableMotorcycles!: number;
}

export class GlobalMetricsDto {
  @ApiProperty({ example: 150 }) totalContracts!: number;
  @ApiProperty({ example: 4500000000 }) totalRevenue!: number;
  @ApiProperty({ example: 3800000000 }) totalInvestment!: number;
}

export class DashboardSummaryDto {
  @ApiProperty({ example: '2026-07-11T15:00:00.000Z' }) generatedAt!: Date;
  @ApiProperty({
    type: Object,
    example: { PENDING: 5, ACTIVE: 10, COMPLETED: 120, CANCELED: 2 },
  })
  contractStatusCounts!: Record<string, number>;
  @ApiProperty({
    type: Object,
    example: { CASH: 20, BANK_TRANSFER: 80, FINANCING: 15 },
  })
  paymentMethodCounts!: Record<string, number>;
  @ApiProperty({ type: [DailyBucketDto] }) dailySales!: DailyBucketDto[];
  @ApiProperty({ type: [DailyBucketDto] })
  dailyPurchases!: DailyBucketDto[];
  @ApiProperty({ type: [RecentActivityItemDto] })
  recentActivity!: RecentActivityItemDto[];
  @ApiProperty({ type: VehicleCountsDto }) vehicleCounts!: VehicleCountsDto;
  @ApiProperty({ type: GlobalMetricsDto }) globalMetrics!: GlobalMetricsDto;
}
