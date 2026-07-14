import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
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
  ApiConflict,
  ApiNotFound,
} from '../common/decorators/api-problem-responses.decorator';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { AllowServiceKey } from '../common/decorators/allow-service-key.decorator';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { CarQueryDto } from './dto/car-query.dto';
import {
  CarResponseDto,
  VehicleCountDto,
  VehicleStatusResponseDto,
} from './dto/vehicle-response.dto';
import { UpdateVehicleStatusDto } from './dto/update-vehicle-status.dto';

@ApiTags('cars')
@ApiBearerAuth()
@ApiAuthErrors()
@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Post()
  @RequirePermissions('car:create')
  @ApiOperation({ summary: 'Register a car in inventory.' })
  @ApiCreatedResponse({
    type: CarResponseDto,
    description: 'Car registered successfully.',
  })
  @ApiBadRequest()
  @ApiConflict()
  create(@Body() dto: CreateCarDto): Promise<CarResponseDto> {
    return this.carsService.create(dto);
  }

  @Get()
  @RequirePermissions('car:read')
  @ApiOperation({ summary: 'List cars with filters and pagination.' })
  @ApiPaginatedResponse(CarResponseDto, 'Paginated list of cars.')
  findAll(
    @Query() query: CarQueryDto,
  ): Promise<PageResponseDto<CarResponseDto>> {
    return this.carsService.findAll(query);
  }

  @Get('count')
  @RequirePermissions('car:read')
  @ApiOperation({ summary: 'Car inventory statistics.' })
  @ApiOkResponse({ type: VehicleCountDto })
  count(): Promise<VehicleCountDto> {
    return this.carsService.count();
  }

  @Get(':id')
  @RequirePermissions('car:read')
  @AllowServiceKey()
  @ApiOperation({
    summary: 'Get a car by id (or via X-Service-Key for ML).',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: CarResponseDto })
  @ApiNotFound()
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CarResponseDto> {
    return this.carsService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('car:update')
  @ApiOperation({ summary: 'Update a car.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({
    type: CarResponseDto,
    description: 'Car updated successfully.',
  })
  @ApiBadRequest()
  @ApiNotFound()
  @ApiConflict()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCarDto,
  ): Promise<CarResponseDto> {
    return this.carsService.update(id, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('car:update')
  @ApiOperation({ summary: 'Change a car status.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: VehicleStatusResponseDto })
  @ApiNotFound()
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVehicleStatusDto,
  ) {
    return this.carsService.changeStatus(id, dto.status);
  }

  @Delete(':id')
  @RequirePermissions('car:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a car.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiNoContentResponse({ description: 'Car deleted successfully.' })
  @ApiNotFound()
  @ApiConflict()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.carsService.remove(id);
  }
}
