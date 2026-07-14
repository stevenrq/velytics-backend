import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractStatus, ContractType, PaymentMethod } from '@prisma/client';

export class ClientSummaryDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 'person' }) type!: string;
  @ApiProperty({ example: 'John Doe' }) name!: string;
  @ApiProperty({ example: '1020304050' }) identifier!: string;
  @ApiProperty({ example: 'john.doe@example.com' }) email!: string;
  @ApiProperty({ example: '3001234567' }) phoneNumber!: string;
}

export class UserSummaryDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 'Admin Velytics' }) fullName!: string;
  @ApiProperty({ example: 'admin@velytics.com' }) email!: string;
  @ApiProperty({ example: 'admin' }) username!: string;
}

export class VehicleSummaryDto {
  @ApiProperty({ example: 10 }) id!: number;
  @ApiProperty({ example: 'car' }) type!: string;
  @ApiProperty({ example: 'Toyota' }) brand!: string;
  @ApiProperty({ example: 'XEI' }) line!: string;
  @ApiProperty({ example: 'Corolla' }) model!: string;
  @ApiProperty({ example: 'ABC123' }) plate!: string;
  @ApiProperty({ example: 'AVAILABLE' }) status!: string;
}

export class PurchaseSaleResponseDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 1 }) clientId!: number;
  @ApiProperty({ example: 1 }) userId!: number;
  @ApiPropertyOptional({ example: 10 }) vehicleId?: number;
  @ApiProperty({ example: 65000000 }) purchasePrice!: number;
  @ApiProperty({ example: 75000000 }) salePrice!: number;
  @ApiProperty({ enum: ContractType, example: ContractType.PURCHASE })
  contractType!: ContractType;
  @ApiProperty({ enum: ContractStatus, example: ContractStatus.PENDING })
  contractStatus!: ContractStatus;
  @ApiProperty({ example: 'Payment on delivery, no financing.' })
  paymentLimitations!: string;
  @ApiProperty({ example: 'Single payment at signing.' })
  paymentTerms!: string;
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.BANK_TRANSFER })
  paymentMethod!: PaymentMethod;
  @ApiPropertyOptional({
    example: 'Vehicle with up-to-date technical inspection.',
  })
  observations?: string;
  @ApiProperty({ example: '2026-05-01T12:00:00.000Z' }) createdAt!: Date;
  @ApiProperty({ example: '2026-06-15T09:30:00.000Z' }) updatedAt!: Date;
}

export class PurchaseSaleDetailResponseDto extends PurchaseSaleResponseDto {
  @ApiProperty({ type: ClientSummaryDto }) clientSummary!: ClientSummaryDto;
  @ApiProperty({ type: UserSummaryDto }) userSummary!: UserSummaryDto;
  @ApiPropertyOptional({ type: VehicleSummaryDto })
  vehicleSummary?: VehicleSummaryDto;
}
