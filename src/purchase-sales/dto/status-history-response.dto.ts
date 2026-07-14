import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractStatus } from '@prisma/client';

export class ContractStatusHistoryResponseDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 1 }) purchaseSaleId!: number;
  @ApiPropertyOptional({
    enum: ContractStatus,
    example: ContractStatus.PENDING,
  })
  previousStatus?: ContractStatus;
  @ApiProperty({ enum: ContractStatus, example: ContractStatus.ACTIVE })
  newStatus!: ContractStatus;
  @ApiPropertyOptional({ example: 1 }) changedBy?: number;
  @ApiProperty({ example: '2026-06-15T09:30:00.000Z' }) changedAt!: Date;
  @ApiPropertyOptional({ example: 'Contrato firmado por ambas partes.' })
  reason?: string;
}
