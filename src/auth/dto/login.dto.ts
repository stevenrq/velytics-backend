import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  @IsNotEmpty({
    message: i18nValidationMessage('common.validation.IS_NOT_EMPTY'),
  })
  username!: string;

  @ApiProperty({ example: 'Admin123!' })
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  @IsNotEmpty({
    message: i18nValidationMessage('common.validation.IS_NOT_EMPTY'),
  })
  password!: string;
}
