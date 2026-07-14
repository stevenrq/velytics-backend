import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiAuthErrors,
  ApiBadRequest,
  ApiNotFound,
} from '../common/decorators/api-problem-responses.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { VehicleImagesService } from './vehicle-images.service';
import {
  PresignedUploadRequestDto,
  PresignedUploadResponseDto,
} from './dto/presigned-upload.dto';
import { ConfirmUploadRequestDto } from './dto/confirm-upload.dto';
import { VehicleImageResponseDto } from './dto/vehicle-image-response.dto';

@ApiTags('vehicle-images')
@ApiBearerAuth()
@ApiAuthErrors()
@Controller('vehicles/:vehicleId/images')
export class VehicleImagesController {
  constructor(private readonly vehicleImagesService: VehicleImagesService) {}

  @Post('presigned-upload')
  @RequirePermissions('vehicle:create')
  @ApiOperation({
    summary: 'Generate a presigned URL to upload an image to S3.',
  })
  @ApiParam({ name: 'vehicleId', example: 10 })
  @ApiCreatedResponse({ type: PresignedUploadResponseDto })
  @ApiBadRequest()
  @ApiNotFound()
  presignedUpload(
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
    @Body() dto: PresignedUploadRequestDto,
  ): Promise<PresignedUploadResponseDto> {
    return this.vehicleImagesService.presignedUpload(vehicleId, dto);
  }

  @Post('confirm-upload')
  @RequirePermissions('vehicle:create')
  @ApiOperation({
    summary: 'Confirm an upload already made to S3 and register it.',
  })
  @ApiParam({ name: 'vehicleId', example: 10 })
  @ApiCreatedResponse({ type: VehicleImageResponseDto })
  @ApiBadRequest()
  @ApiNotFound()
  confirmUpload(
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
    @Body() dto: ConfirmUploadRequestDto,
  ): Promise<VehicleImageResponseDto> {
    return this.vehicleImagesService.confirmUpload(vehicleId, dto);
  }

  @Get()
  @RequirePermissions('vehicle:read')
  @ApiOperation({
    summary: 'List the images of a vehicle with signed URLs.',
  })
  @ApiParam({ name: 'vehicleId', example: 10 })
  @ApiOkResponse({ type: [VehicleImageResponseDto] })
  @ApiNotFound()
  list(
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
  ): Promise<VehicleImageResponseDto[]> {
    return this.vehicleImagesService.list(vehicleId);
  }

  @Delete(':imageId')
  @RequirePermissions('vehicle:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a vehicle image.' })
  @ApiParam({ name: 'vehicleId', example: 10 })
  @ApiParam({ name: 'imageId', example: 1 })
  @ApiNoContentResponse({ description: 'Image deleted successfully.' })
  @ApiNotFound()
  remove(
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ): Promise<void> {
    return this.vehicleImagesService.remove(vehicleId, imageId);
  }
}
