import { ApiProperty } from '@nestjs/swagger';
import { VehicleStatus } from '@prisma/client';

export class CarResponseDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 'Toyota' }) brand!: string;
  @ApiProperty({ example: 'Corolla' }) model!: string;
  @ApiProperty({ example: 'XEI' }) line!: string;
  @ApiProperty({ example: 5 }) capacity!: number;
  @ApiProperty({ example: 'ABC123' }) plate!: string;
  @ApiProperty({ example: 'MTR123456789' }) motorNumber!: string;
  @ApiProperty({ example: 'SER123456789' }) serialNumber!: string;
  @ApiProperty({ example: 'CHS123456789' }) chassisNumber!: string;
  @ApiProperty({ example: 'Blanco' }) color!: string;
  @ApiProperty({ example: 'Springfield' }) cityRegistered!: string;
  @ApiProperty({ example: 2021 }) year!: number;
  @ApiProperty({ example: 35000 }) mileage!: number;
  @ApiProperty({ example: 'Automatic' }) transmission!: string;
  @ApiProperty({ enum: VehicleStatus, example: VehicleStatus.AVAILABLE })
  status!: VehicleStatus;
  @ApiProperty({ example: 65000000 }) purchasePrice!: number;
  @ApiProperty({ example: 75000000 }) salePrice!: number;
  @ApiProperty({ example: 'SEDAN' }) bodyType!: string;
  @ApiProperty({ example: 'GASOLINA' }) fuelType!: string;
  @ApiProperty({ example: 4 }) numberOfDoors!: number;
  @ApiProperty({ example: '2026-05-01T12:00:00.000Z' }) createdAt!: Date;
  @ApiProperty({ example: '2026-06-15T09:30:00.000Z' }) updatedAt!: Date;
}

export class MotorcycleResponseDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 'Yamaha' }) brand!: string;
  @ApiProperty({ example: 'MT-03' }) model!: string;
  @ApiProperty({ example: 'MT' }) line!: string;
  @ApiProperty({ example: 2 }) capacity!: number;
  @ApiProperty({ example: 'XYZ789' }) plate!: string;
  @ApiProperty({ example: 'MTR987654321' }) motorNumber!: string;
  @ApiProperty({ example: 'SER987654321' }) serialNumber!: string;
  @ApiProperty({ example: 'CHS987654321' }) chassisNumber!: string;
  @ApiProperty({ example: 'Negro' }) color!: string;
  @ApiProperty({ example: 'Riverside' }) cityRegistered!: string;
  @ApiProperty({ example: 2022 }) year!: number;
  @ApiProperty({ example: 12000 }) mileage!: number;
  @ApiProperty({ example: 'Manual' }) transmission!: string;
  @ApiProperty({ enum: VehicleStatus, example: VehicleStatus.AVAILABLE })
  status!: VehicleStatus;
  @ApiProperty({ example: 18000000 }) purchasePrice!: number;
  @ApiProperty({ example: 21000000 }) salePrice!: number;
  @ApiProperty({ example: 'NAKED' }) motorcycleType!: string;
  @ApiProperty({ example: '2026-05-01T12:00:00.000Z' }) createdAt!: Date;
  @ApiProperty({ example: '2026-06-15T09:30:00.000Z' }) updatedAt!: Date;
}

export class VehicleCountDto {
  @ApiProperty({ example: 120 }) total!: number;
  @ApiProperty({ example: 95 }) available!: number;
  @ApiProperty({ example: 25 }) unavailable!: number;
}

export class VehicleStatusResponseDto {
  @ApiProperty({ enum: VehicleStatus, example: VehicleStatus.SOLD })
  status!: VehicleStatus;
}
