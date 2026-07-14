import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { MAX_IMAGE_SIZE_BYTES } from '../constants';

export const ALLOWED_IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export class PresignedUploadRequestDto {
  @ApiProperty({
    enum: ALLOWED_IMAGE_CONTENT_TYPES,
    example: 'image/jpeg',
  })
  @IsIn(ALLOWED_IMAGE_CONTENT_TYPES, {
    message: i18nValidationMessage('common.validation.IS_IN'),
  })
  contentType!: string;

  @ApiProperty({
    example: 245760,
    description:
      'Declared size in bytes; rejected before a presigned URL is issued if it exceeds the max allowed image size.',
  })
  @IsInt({ message: i18nValidationMessage('common.validation.IS_INT') })
  @Min(1, { message: i18nValidationMessage('common.validation.MIN') })
  @Max(MAX_IMAGE_SIZE_BYTES, {
    message: i18nValidationMessage('common.validation.MAX'),
  })
  size!: number;
}

export class PresignedUploadResponseDto {
  @ApiProperty({ example: 'velytics-vehicle-images' }) bucket!: string;
  @ApiProperty({ example: 'vehicles/10/corolla-frontal.jpg' }) key!: string;
  @ApiProperty({
    example:
      'https://velytics-vehicle-images.s3.amazonaws.com/vehicles/10/corolla-frontal.jpg?X-Amz-Signature=...',
  })
  url!: string;
}
