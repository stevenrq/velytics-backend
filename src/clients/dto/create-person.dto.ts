import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
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
  PHONE_NUMBER_REGEX,
} from '../../common/validation.constants';

export class CreatePersonDto {
  @ApiProperty({ example: '1020304050' })
  @Matches(NATIONAL_ID_REGEX, {
    message: i18nValidationMessage('common.validation.NATIONAL_ID'),
  })
  nationalId!: string;

  @ApiProperty({ example: 'John' })
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  @Length(3, 30, { message: i18nValidationMessage('common.validation.LENGTH') })
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  @Length(3, 30, { message: i18nValidationMessage('common.validation.LENGTH') })
  lastName!: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: i18nValidationMessage('common.validation.IS_EMAIL') })
  @MaxLength(40, {
    message: i18nValidationMessage('common.validation.MAX_LENGTH'),
  })
  email!: string;

  @ApiProperty({ example: '3001234567' })
  @Matches(PHONE_NUMBER_REGEX, {
    message: i18nValidationMessage('common.validation.PHONE'),
  })
  phoneNumber!: string;

  @ApiPropertyOptional({ type: AddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('common.validation.IS_BOOLEAN') })
  enabled?: boolean;
}
