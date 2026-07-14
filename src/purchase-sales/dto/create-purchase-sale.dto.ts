import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ContractStatus, ContractType, PaymentMethod } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { VehicleCreationRequestDto } from './vehicle-creation-request.dto';

const IS_INT = i18nValidationMessage('common.validation.IS_INT');
const IS_STRING = i18nValidationMessage('common.validation.IS_STRING');
const IS_NUMBER = i18nValidationMessage('common.validation.IS_NUMBER');
const IS_ENUM = i18nValidationMessage('common.validation.IS_ENUM');
const MIN = i18nValidationMessage('common.validation.MIN');
const MAX_LENGTH = i18nValidationMessage('common.validation.MAX_LENGTH');

export class CreatePurchaseSaleDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: IS_INT })
  clientId!: number;

  @ApiProperty({ example: 1 })
  @IsInt({ message: IS_INT })
  userId!: number;

  @ApiPropertyOptional({
    description:
      'Required for SALE. For PURCHASE, if omitted vehicleData must be sent.',
    example: 10,
  })
  @IsOptional()
  @IsInt({ message: IS_INT })
  vehicleId?: number;

  @ApiPropertyOptional({ default: 0, example: 65000000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: IS_NUMBER })
  @Min(0, { message: MIN })
  purchasePrice?: number;

  @ApiPropertyOptional({ default: 0, example: 75000000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: IS_NUMBER })
  @Min(0, { message: MIN })
  salePrice?: number;

  @ApiPropertyOptional({
    enum: ContractType,
    default: ContractType.PURCHASE,
    example: ContractType.PURCHASE,
  })
  @IsOptional()
  @IsEnum(ContractType, { message: IS_ENUM })
  contractType?: ContractType;

  @ApiPropertyOptional({
    enum: ContractStatus,
    default: ContractStatus.PENDING,
    example: ContractStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(ContractStatus, { message: IS_ENUM })
  contractStatus?: ContractStatus;

  @ApiProperty({
    maxLength: 200,
    example: 'Payment on delivery, no financing.',
  })
  @IsString({ message: IS_STRING })
  @MaxLength(200, { message: MAX_LENGTH })
  paymentLimitations!: string;

  @ApiProperty({
    maxLength: 200,
    example: 'Single payment at signing.',
  })
  @IsString({ message: IS_STRING })
  @MaxLength(200, { message: MAX_LENGTH })
  paymentTerms!: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.BANK_TRANSFER })
  @IsEnum(PaymentMethod, { message: IS_ENUM })
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({
    maxLength: 500,
    example: 'Vehicle with up-to-date technical inspection.',
  })
  @IsOptional()
  @IsString({ message: IS_STRING })
  @MaxLength(500, { message: MAX_LENGTH })
  observations?: string;

  @ApiPropertyOptional({
    type: VehicleCreationRequestDto,
    description:
      'Only for PURCHASE without vehicleId: creates the vehicle in the same transaction.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleCreationRequestDto)
  vehicleData?: VehicleCreationRequestDto;
}
