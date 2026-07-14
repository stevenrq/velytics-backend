import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AddressDto {
  @ApiProperty({ maxLength: 100, example: 'Evergreen Terrace' })
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  @Length(5, 100, {
    message: i18nValidationMessage('common.validation.LENGTH'),
  })
  street!: string;

  @ApiProperty({ maxLength: 20, example: '742' })
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  @Length(1, 20, { message: i18nValidationMessage('common.validation.LENGTH') })
  number!: string;

  @ApiProperty({ maxLength: 50, example: 'Springfield' })
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  @Length(3, 50, { message: i18nValidationMessage('common.validation.LENGTH') })
  city!: string;
}

export class AddressResponseDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 'Evergreen Terrace' }) street!: string;
  @ApiProperty({ example: '742' }) number!: string;
  @ApiProperty({ example: 'Springfield' }) city!: string;
}
