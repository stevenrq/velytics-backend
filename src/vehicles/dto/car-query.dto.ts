import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { VehicleQueryBaseDto } from './vehicle-query-base.dto';

export class CarQueryDto extends VehicleQueryBaseDto {
  @ApiPropertyOptional({ example: 'GASOLINA' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  fuelType?: string;
  @ApiPropertyOptional({ example: 'SEDAN' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  bodyType?: string;
}
