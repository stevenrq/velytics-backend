import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CreateUserDto } from './create-user.dto';
import { PASSWORD_MAX_LENGTH } from '../constants';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    description:
      "Required when roleNames is provided. Must equal the user's current updatedAt (from GET /users/:id), to prevent silently overwriting a concurrent role change.",
    example: '2026-07-13T10:00:00.000Z',
  })
  @ValidateIf((dto: UpdateUserDto) => dto.roleNames !== undefined)
  @IsDateString(
    {},
    { message: i18nValidationMessage('common.validation.IS_DATE_STRING') },
  )
  expectedUpdatedAt?: string;

  @ApiPropertyOptional({
    description:
      "Required and verified when a user changes their OWN password (self-service). Not required when an admin holding user:update resets another user's password.",
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  @Length(1, PASSWORD_MAX_LENGTH, {
    message: i18nValidationMessage('common.validation.LENGTH'),
  })
  currentPassword?: string;
}
