import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { VehicleQueryBaseDto } from './vehicle-query-base.dto';

export class MotorcycleQueryDto extends VehicleQueryBaseDto {
  @ApiPropertyOptional({ example: 'NAKED' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('common.validation.IS_STRING') })
  motorcycleType?: string;
}
