import { ApiProperty } from '@nestjs/swagger';
import { VehicleStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateVehicleStatusDto {
  @ApiProperty({ enum: VehicleStatus, example: VehicleStatus.SOLD })
  @IsEnum(VehicleStatus, {
    message: i18nValidationMessage('common.validation.IS_ENUM'),
  })
  status!: VehicleStatus;
}
