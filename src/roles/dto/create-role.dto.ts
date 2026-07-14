import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, Length } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateRoleDto {
  @ApiProperty({ example: 'SALES_MANAGER' })
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  @Length(3, 20, { message: i18nValidationMessage('common.validation.LENGTH') })
  name!: string;

  @ApiPropertyOptional({ example: 'Vehicle sales manager.' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['vehicle:read', 'purchase_sale:create'],
  })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage('common.validation.IS_ARRAY') })
  @IsString({
    each: true,
    message: i18nValidationMessage('common.validation.IS_STRING'),
  })
  permissionNames?: string[];
}
