import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { AddressDto } from '../../common/dto/address.dto';
import {
  NATIONAL_ID_REGEX,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PHONE_NUMBER_REGEX,
  USERNAME_REGEX,
} from '../constants';

export class CreateUserDto {
  @ApiProperty({ example: '1020304050' })
  @Matches(NATIONAL_ID_REGEX, {
    message: i18nValidationMessage('common.validation.NATIONAL_ID'),
  })
  nationalId!: string;

  @ApiProperty({ example: 'Jane' })
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  @Length(3, 20, { message: i18nValidationMessage('common.validation.LENGTH') })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  @Length(3, 20, { message: i18nValidationMessage('common.validation.LENGTH') })
  lastName!: string;

  @ApiProperty({ example: 'jane.doe@velytics.com' })
  @IsEmail({}, { message: i18nValidationMessage('common.validation.IS_EMAIL') })
  @MaxLength(40, {
    message: i18nValidationMessage('common.validation.MAX_LENGTH'),
  })
  email!: string;

  @ApiProperty({ example: '3009876543' })
  @Matches(PHONE_NUMBER_REGEX, {
    message: i18nValidationMessage('common.validation.PHONE'),
  })
  phoneNumber!: string;

  @ApiProperty({ example: 'jdoe' })
  @Matches(USERNAME_REGEX, {
    message: i18nValidationMessage('users.validation.USERNAME'),
  })
  username!: string;

  @ApiProperty({ example: 'Correct-Horse-Battery-Staple' })
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, {
    message: i18nValidationMessage('users.validation.PASSWORD_LENGTH'),
  })
  password!: string;

  @ApiPropertyOptional({ type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({
    type: [String],
    description: 'Role names to assign. Defaults to USER.',
    example: ['ADMIN'],
  })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage('common.validation.IS_ARRAY') })
  @IsString({
    each: true,
    message: i18nValidationMessage('common.validation.IS_STRING'),
  })
  roleNames?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('common.validation.IS_BOOLEAN') })
  enabled?: boolean;
}
