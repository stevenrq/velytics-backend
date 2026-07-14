import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Length, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { VehicleBaseDto } from './vehicle-base.dto';

export class CreateCarDto extends VehicleBaseDto {
  @ApiProperty({ example: 'SEDAN' })
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  @Length(2, 20, { message: i18nValidationMessage('common.validation.LENGTH') })
  bodyType!: string;

  @ApiProperty({ example: 'GASOLINA' })
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  @Length(2, 20, { message: i18nValidationMessage('common.validation.LENGTH') })
  fuelType!: string;

  @ApiProperty({ example: 4 })
  @IsInt({ message: i18nValidationMessage('common.validation.IS_INT') })
  @Min(2, { message: i18nValidationMessage('common.validation.MIN') })
  numberOfDoors!: number;
}
