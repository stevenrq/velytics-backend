import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsString,
  Length,
  Min,
  ValidateIf,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { VehicleBaseDto } from '../../vehicles/dto/vehicle-base.dto';

const IS_STRING = i18nValidationMessage('common.validation.IS_STRING');
const LENGTH = i18nValidationMessage('common.validation.LENGTH');
const IS_INT = i18nValidationMessage('common.validation.IS_INT');
const MIN = i18nValidationMessage('common.validation.MIN');

export class VehicleCreationRequestDto extends VehicleBaseDto {
  @ApiProperty({ enum: VehicleType, example: VehicleType.CAR })
  @IsEnum(VehicleType, {
    message: i18nValidationMessage('common.validation.IS_ENUM'),
  })
  type!: VehicleType;

  @ApiPropertyOptional({
    description: 'Required if type=CAR.',
    example: 'SEDAN',
  })
  @ValidateIf((o: VehicleCreationRequestDto) => o.type === 'CAR')
  @IsString({ message: IS_STRING })
  @Length(2, 20, { message: LENGTH })
  bodyType?: string;

  @ApiPropertyOptional({
    description: 'Required if type=CAR.',
    example: 'GASOLINA',
  })
  @ValidateIf((o: VehicleCreationRequestDto) => o.type === 'CAR')
  @IsString({ message: IS_STRING })
  @Length(2, 20, { message: LENGTH })
  fuelType?: string;

  @ApiPropertyOptional({ description: 'Required if type=CAR.', example: 4 })
  @ValidateIf((o: VehicleCreationRequestDto) => o.type === 'CAR')
  @IsInt({ message: IS_INT })
  @Min(2, { message: MIN })
  numberOfDoors?: number;

  @ApiPropertyOptional({
    description: 'Required if type=MOTORCYCLE.',
    example: 'NAKED',
  })
  @ValidateIf((o: VehicleCreationRequestDto) => o.type === 'MOTORCYCLE')
  @IsString({ message: IS_STRING })
  @Length(2, 20, { message: LENGTH })
  motorcycleType?: string;
}
