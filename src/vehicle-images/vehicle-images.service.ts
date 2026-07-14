import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from './s3.service';
import {
  PresignedUploadRequestDto,
  PresignedUploadResponseDto,
} from './dto/presigned-upload.dto';
import { ConfirmUploadRequestDto } from './dto/confirm-upload.dto';
import { VehicleImageResponseDto } from './dto/vehicle-image-response.dto';
import {
  ContentTypeMismatchException,
  DuplicateImageException,
  KeyMismatchException,
  SizeMismatchException,
  UploadedObjectNotFoundException,
  VehicleImageNotFoundException,
  VehicleNotFoundException,
} from './exceptions/vehicle-image.exceptions';

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class VehicleImagesService {
  private readonly logger = new Logger(VehicleImagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async presignedUpload(
    vehicleId: number,
    dto: PresignedUploadRequestDto,
  ): Promise<PresignedUploadResponseDto> {
    await this.ensureVehicleExists(vehicleId);

    const extension = EXTENSION_BY_CONTENT_TYPE[dto.contentType];
    const key = `vehicles/${vehicleId}/${randomUUID()}.${extension}`;
    const url = await this.s3.presignUpload(key, dto.contentType);

    return { bucket: this.s3.bucketName, key, url };
  }

  async confirmUpload(
    vehicleId: number,
    dto: ConfirmUploadRequestDto,
  ): Promise<VehicleImageResponseDto> {
    await this.ensureVehicleExists(vehicleId);

    const expectedPrefix = `vehicles/${vehicleId}/`;
    if (!dto.key.startsWith(expectedPrefix)) {
      throw new KeyMismatchException();
    }

    const head = await this.s3.headObject(dto.key);
    if (!head) {
      throw new UploadedObjectNotFoundException();
    }
    if (head.contentType && head.contentType !== dto.contentType) {
      throw new ContentTypeMismatchException();
    }
    if (head.contentLength !== undefined && head.contentLength !== dto.size) {
      throw new SizeMismatchException();
    }

    const existing = await this.prisma.vehicleImage.findFirst({
      where: { OR: [{ key: dto.key }, { fileName: dto.fileName }] },
    });
    if (existing) {
      // The object was already uploaded to S3 under this (now-rejected) key;
      // clean it up so it doesn't linger as an orphan with no DB record.
      await this.s3.deleteObject(dto.key);
      throw new DuplicateImageException();
    }

    const isFirstImage =
      (await this.prisma.vehicleImage.count({ where: { vehicleId } })) === 0;
    const isPrimary = dto.primary === true || isFirstImage;

    const image = await this.prisma.$transaction(async (tx) => {
      if (isPrimary) {
        await tx.vehicleImage.updateMany({
          where: { vehicleId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      return tx.vehicleImage.create({
        data: {
          vehicleId,
          bucket: this.s3.bucketName,
          key: dto.key,
          fileName: dto.fileName,
          mimeType: dto.contentType,
          size: dto.size,
          isPrimary,
        },
      });
    });

    const url = await this.s3.presignDownload(image.key);
    return { id: image.id, url, isPrimary: image.isPrimary };
  }

  async list(vehicleId: number): Promise<VehicleImageResponseDto[]> {
    await this.ensureVehicleExists(vehicleId);
    const images = await this.prisma.vehicleImage.findMany({
      where: { vehicleId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
    return Promise.all(
      images.map(async (image) => ({
        id: image.id,
        url: await this.s3.presignDownload(image.key),
        isPrimary: image.isPrimary,
      })),
    );
  }

  async remove(vehicleId: number, imageId: number): Promise<void> {
    const image = await this.prisma.vehicleImage.findFirst({
      where: { id: imageId, vehicleId },
    });
    if (!image) {
      this.logger.error('Vehicle image not found', {
        key: 'vehicle-images.errors.IMAGE_NOT_FOUND',
        imageId,
      });
      throw new VehicleImageNotFoundException(imageId);
    }

    try {
      await this.s3.deleteObject(image.key);
    } catch {
      // The object may have been deleted externally; clean up the record anyway.
    }
    await this.prisma.vehicleImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const nextPrimary = await this.prisma.vehicleImage.findFirst({
        where: { vehicleId },
        orderBy: { createdAt: 'asc' },
      });
      if (nextPrimary) {
        await this.prisma.vehicleImage.update({
          where: { id: nextPrimary.id },
          data: { isPrimary: true },
        });
      }
    }
  }

  private async ensureVehicleExists(vehicleId: number): Promise<void> {
    const count = await this.prisma.vehicle.count({ where: { id: vehicleId } });
    if (count === 0) {
      this.logger.error('Vehicle not found', {
        key: 'vehicle-images.errors.VEHICLE_NOT_FOUND',
        vehicleId,
      });
      throw new VehicleNotFoundException(vehicleId);
    }
  }
}
