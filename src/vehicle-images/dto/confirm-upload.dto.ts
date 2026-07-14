import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ALLOWED_IMAGE_CONTENT_TYPES } from './presigned-upload.dto';
import { MAX_IMAGE_SIZE_BYTES } from '../constants';

const IS_STRING = i18nValidationMessage('common.validation.IS_STRING');
const LENGTH = i18nValidationMessage('common.validation.LENGTH');

export class ConfirmUploadRequestDto {
  @ApiProperty({ example: 'corolla-frontal.jpg' })
  @IsString({ message: IS_STRING })
  @Length(1, 255, { message: LENGTH })
  fileName!: string;
  @ApiProperty({
    enum: ALLOWED_IMAGE_CONTENT_TYPES,
    example: 'image/jpeg',
  })
  @IsIn(ALLOWED_IMAGE_CONTENT_TYPES, {
    message: i18nValidationMessage('common.validation.IS_IN'),
  })
  contentType!: string;
  @ApiProperty({ example: 245760 })
  @IsInt({ message: i18nValidationMessage('common.validation.IS_INT') })
  @Min(1, { message: i18nValidationMessage('common.validation.MIN') })
  @Max(MAX_IMAGE_SIZE_BYTES, {
    message: i18nValidationMessage('common.validation.MAX'),
  })
  size!: number;
  @ApiProperty({ example: 'vehicles/10/corolla-frontal.jpg' })
  @IsString({ message: IS_STRING })
  @Length(1, 255, { message: LENGTH })
  key!: string;
  @ApiPropertyOptional({ default: false, example: true })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('common.validation.IS_BOOLEAN') })
  primary?: boolean;
}
