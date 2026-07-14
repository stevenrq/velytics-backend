import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { VehicleStatus } from '@prisma/client';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

const IS_STRING = i18nValidationMessage('common.validation.IS_STRING');
const IS_INT = i18nValidationMessage('common.validation.IS_INT');
const IS_NUMBER = i18nValidationMessage('common.validation.IS_NUMBER');
const IS_ENUM = i18nValidationMessage('common.validation.IS_ENUM');

export class VehicleQueryBaseDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'ABC123' })
  @IsOptional()
  @IsString({ message: IS_STRING })
  plate?: string;
  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString({ message: IS_STRING })
  brand?: string;
  @ApiPropertyOptional({ example: 'XEI' })
  @IsOptional()
  @IsString({ message: IS_STRING })
  line?: string;
  @ApiPropertyOptional({ example: 'Corolla' })
  @IsOptional()
  @IsString({ message: IS_STRING })
  model?: string;
  @ApiPropertyOptional({ example: 'Automatic' })
  @IsOptional()
  @IsString({ message: IS_STRING })
  transmission?: string;
  @ApiPropertyOptional({ example: 'Springfield' })
  @IsOptional()
  @IsString({ message: IS_STRING })
  city?: string;

  @ApiPropertyOptional({
    enum: VehicleStatus,
    example: VehicleStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(VehicleStatus, { message: IS_ENUM })
  status?: VehicleStatus;

  @ApiPropertyOptional({ example: 2015 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: IS_INT })
  minYear?: number;
  @ApiPropertyOptional({ example: 2023 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: IS_INT })
  maxYear?: number;
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: IS_INT })
  minCapacity?: number;
  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: IS_INT })
  maxCapacity?: number;
  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: IS_INT })
  minMileage?: number;
  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: IS_INT })
  maxMileage?: number;
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
}
