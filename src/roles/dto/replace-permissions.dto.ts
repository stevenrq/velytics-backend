import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsDateString, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ReplacePermissionsDto {
  @ApiProperty({
    type: [String],
    example: ['vehicle:read', 'purchase_sale:create'],
  })
  @IsArray({ message: i18nValidationMessage('common.validation.IS_ARRAY') })
  @IsString({
    each: true,
    message: i18nValidationMessage('common.validation.IS_STRING'),
  })
  @ArrayUnique({
    message: i18nValidationMessage('common.validation.ARRAY_UNIQUE'),
  })
  permissionNames!: string[];

  @ApiProperty({
    description:
      "Must equal the role's current updatedAt (from GET /roles/:id), to prevent silently overwriting a concurrent permission change.",
    example: '2026-07-13T10:00:00.000Z',
  })
  @IsDateString(
    {},
    { message: i18nValidationMessage('common.validation.IS_DATE_STRING') },
  )
  expectedUpdatedAt!: string;
}
