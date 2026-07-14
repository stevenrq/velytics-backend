import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CompanyQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '9001234567' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Matches the company name.',
    example: 'Valley Motors',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  companyName?: string;

  @ApiPropertyOptional({ example: 'contact@valleymotors.com' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  email?: string;

  @ApiPropertyOptional({ example: '3011234567' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  phoneNumber?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: i18nValidationMessage('common.validation.IS_BOOLEAN') })
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'City of the associated address.',
    example: 'Springfield',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  city?: string;
}
