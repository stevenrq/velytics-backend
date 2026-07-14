import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

const IS_STRING = i18nValidationMessage('common.validation.IS_STRING');
const LENGTH = i18nValidationMessage('common.validation.LENGTH');
const IS_INT = i18nValidationMessage('common.validation.IS_INT');
const IS_NUMBER = i18nValidationMessage('common.validation.IS_NUMBER');
const MIN = i18nValidationMessage('common.validation.MIN');
const MAX = i18nValidationMessage('common.validation.MAX');

export class VehicleBaseDto {
  @ApiProperty({ example: 'Toyota' })
  @IsString({ message: IS_STRING })
  @Length(2, 20, { message: LENGTH })
  brand!: string;

  @ApiProperty({ example: 'Corolla' })
  @IsString({ message: IS_STRING })
  @Length(1, 20, { message: LENGTH })
  model!: string;

  @ApiProperty({ example: 'XEI' })
  @IsString({ message: IS_STRING })
  @Length(1, 20, { message: LENGTH })
  line!: string;

  @ApiProperty({ example: 5 })
  @IsInt({ message: IS_INT })
  @Min(1, { message: MIN })
  capacity!: number;

  @ApiProperty({ example: 'ABC123' })
  @IsString({ message: IS_STRING })
  @Length(4, 10, { message: LENGTH })
  plate!: string;

  @ApiProperty({ example: 'MTR123456789' })
  @IsString({ message: IS_STRING })
  @Length(4, 30, { message: LENGTH })
  motorNumber!: string;

  @ApiProperty({ example: 'SER123456789' })
  @IsString({ message: IS_STRING })
  @Length(4, 30, { message: LENGTH })
  serialNumber!: string;

  @ApiProperty({ example: 'CHS123456789' })
  @IsString({ message: IS_STRING })
  @Length(4, 30, { message: LENGTH })
  chassisNumber!: string;

  @ApiProperty({ example: 'Blanco' })
  @IsString({ message: IS_STRING })
  @Length(2, 20, { message: LENGTH })
  color!: string;

  @ApiProperty({ example: 'Springfield' })
  @IsString({ message: IS_STRING })
  @Length(2, 30, { message: LENGTH })
  cityRegistered!: string;

  @ApiProperty({ example: 2021 })
  @IsInt({ message: IS_INT })
  @Min(1950, { message: MIN })
  @Max(2050, { message: MAX })
  year!: number;

  @ApiProperty({ example: 35000 })
  @IsInt({ message: IS_INT })
  @Min(0, { message: MIN })
  mileage!: number;

  @ApiProperty({ example: 'Automatic' })
  @IsString({ message: IS_STRING })
  @Length(2, 20, { message: LENGTH })
  transmission!: string;

  @ApiProperty({ example: 65000000 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: IS_NUMBER })
  @Min(0, { message: MIN })
  purchasePrice!: number;

  @ApiProperty({ example: 75000000 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: IS_NUMBER })
  @Min(0, { message: MIN })
  salePrice!: number;

  @ApiPropertyOptional({
    enum: VehicleStatus,
    default: VehicleStatus.AVAILABLE,
    example: VehicleStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(VehicleStatus, {
    message: i18nValidationMessage('common.validation.IS_ENUM'),
  })
  status?: VehicleStatus;
}
