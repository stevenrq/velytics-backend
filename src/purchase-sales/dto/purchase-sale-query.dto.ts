import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ContractStatus, ContractType, PaymentMethod } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

const IS_INT = i18nValidationMessage('common.validation.IS_INT');
const IS_NUMBER = i18nValidationMessage('common.validation.IS_NUMBER');
const IS_ENUM = i18nValidationMessage('common.validation.IS_ENUM');
const IS_STRING = i18nValidationMessage('common.validation.IS_STRING');
const IS_BOOLEAN = i18nValidationMessage('common.validation.IS_BOOLEAN');
const IS_DATE_STRING = i18nValidationMessage(
  'common.validation.IS_DATE_STRING',
);

export class PurchaseSaleQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ContractType, example: ContractType.PURCHASE })
  @IsOptional()
  @IsEnum(ContractType, { message: IS_ENUM })
  contractType?: ContractType;

  @ApiPropertyOptional({
    enum: ContractStatus,
    example: ContractStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(ContractStatus, { message: IS_ENUM })
  contractStatus?: ContractStatus;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: IS_INT })
  clientId?: number;
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: IS_INT })
  userId?: number;
  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: IS_INT })
  vehicleId?: number;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER,
  })
  @IsOptional()
  @IsEnum(PaymentMethod, { message: IS_ENUM })
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'ISO date; filters by updatedAt >= startDate.',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: IS_DATE_STRING })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'ISO date; filters by updatedAt <= endDate.',
    example: '2026-06-30',
  })
  @IsOptional()
  @IsDateString({}, { message: IS_DATE_STRING })
  endDate?: string;

  @ApiPropertyOptional({ example: 10000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: IS_NUMBER })
  minPurchasePrice?: number;
  @ApiPropertyOptional({ example: 100000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: IS_NUMBER })
  maxPurchasePrice?: number;
  @ApiPropertyOptional({ example: 10000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: IS_NUMBER })
  minSalePrice?: number;
  @ApiPropertyOptional({ example: 100000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: IS_NUMBER })
  maxSalePrice?: number;

  @ApiPropertyOptional({
    description: 'Free-text search across terms, limitations and remarks.',
    example: 'financing',
  })
  @IsOptional()
  @IsString({ message: IS_STRING })
  term?: string;

  @ApiPropertyOptional({ default: false, example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: IS_BOOLEAN })
  detailed?: boolean;
}
