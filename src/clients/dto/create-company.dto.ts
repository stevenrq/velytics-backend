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
import { PHONE_NUMBER_REGEX } from '../../common/validation.constants';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Company NIT/RUC (tax id).',
    example: '9001234567',
  })
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  @Length(5, 10, { message: i18nValidationMessage('common.validation.LENGTH') })
  taxId!: string;

  @ApiProperty({ example: 'Valley Motors Inc.' })
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  @Length(3, 30, { message: i18nValidationMessage('common.validation.LENGTH') })
  companyName!: string;

  @ApiProperty({ example: 'contact@valleymotors.com' })
  @IsEmail({}, { message: i18nValidationMessage('common.validation.IS_EMAIL') })
  @MaxLength(40, {
    message: i18nValidationMessage('common.validation.MAX_LENGTH'),
  })
  email!: string;

  @ApiProperty({ example: '3011234567' })
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
