import { ApiProperty } from '@nestjs/swagger';

export class VehicleImageResponseDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({
    example:
      'https://velytics-vehicle-images.s3.amazonaws.com/vehicles/10/corolla-frontal.jpg',
  })
  url!: string;
  @ApiProperty({ example: true }) isPrimary!: boolean;
}
