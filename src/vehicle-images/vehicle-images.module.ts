import { Module } from '@nestjs/common';
import { VehicleImagesController } from './vehicle-images.controller';
import { VehicleImagesService } from './vehicle-images.service';
import { S3Service } from './s3.service';

@Module({
  controllers: [VehicleImagesController],
  providers: [VehicleImagesService, S3Service],
})
export class VehicleImagesModule {}
