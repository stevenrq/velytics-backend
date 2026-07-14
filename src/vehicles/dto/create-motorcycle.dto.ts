import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { VehicleBaseDto } from './vehicle-base.dto';

export class CreateMotorcycleDto extends VehicleBaseDto {
  @ApiProperty({ example: 'NAKED' })
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  @Length(2, 20, { message: i18nValidationMessage('common.validation.LENGTH') })
  motorcycleType!: string;
}
