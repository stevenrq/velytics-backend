import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class PersonQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Matches first or last name.',
    example: 'John',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  name?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  email?: string;

  @ApiPropertyOptional({ example: '1020304050' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  nationalId?: string;

  @ApiPropertyOptional({ example: '3001234567' })
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
