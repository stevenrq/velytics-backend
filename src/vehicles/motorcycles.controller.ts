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
import { MotorcyclesService } from './motorcycles.service';
import { CreateMotorcycleDto } from './dto/create-motorcycle.dto';
import { UpdateMotorcycleDto } from './dto/update-motorcycle.dto';
import { MotorcycleQueryDto } from './dto/motorcycle-query.dto';
import {
  MotorcycleResponseDto,
  VehicleCountDto,
  VehicleStatusResponseDto,
} from './dto/vehicle-response.dto';
import { UpdateVehicleStatusDto } from './dto/update-vehicle-status.dto';

@ApiTags('motorcycles')
@ApiBearerAuth()
@ApiAuthErrors()
@Controller('motorcycles')
export class MotorcyclesController {
  constructor(private readonly motorcyclesService: MotorcyclesService) {}

  @Post()
  @RequirePermissions('motorcycle:create')
  @ApiOperation({ summary: 'Register a motorcycle in inventory.' })
  @ApiCreatedResponse({
    type: MotorcycleResponseDto,
    description: 'Motorcycle registered successfully.',
  })
  @ApiBadRequest()
  @ApiConflict()
  create(@Body() dto: CreateMotorcycleDto): Promise<MotorcycleResponseDto> {
    return this.motorcyclesService.create(dto);
  }

  @Get()
  @RequirePermissions('motorcycle:read')
  @ApiOperation({ summary: 'List motorcycles with filters and pagination.' })
  @ApiPaginatedResponse(MotorcycleResponseDto, 'Paginated list of motorcycles.')
  findAll(
    @Query() query: MotorcycleQueryDto,
  ): Promise<PageResponseDto<MotorcycleResponseDto>> {
    return this.motorcyclesService.findAll(query);
  }

  @Get('count')
  @RequirePermissions('motorcycle:read')
  @ApiOperation({ summary: 'Motorcycle inventory statistics.' })
  @ApiOkResponse({ type: VehicleCountDto })
  count(): Promise<VehicleCountDto> {
    return this.motorcyclesService.count();
  }

  @Get(':id')
  @RequirePermissions('motorcycle:read')
  @AllowServiceKey()
  @ApiOperation({
    summary: 'Get a motorcycle by id (or via X-Service-Key for ML).',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: MotorcycleResponseDto })
  @ApiNotFound()
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MotorcycleResponseDto> {
    return this.motorcyclesService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('motorcycle:update')
  @ApiOperation({ summary: 'Update a motorcycle.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({
    type: MotorcycleResponseDto,
    description: 'Motorcycle updated successfully.',
  })
  @ApiBadRequest()
  @ApiNotFound()
  @ApiConflict()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMotorcycleDto,
  ): Promise<MotorcycleResponseDto> {
    return this.motorcyclesService.update(id, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('motorcycle:update')
  @ApiOperation({ summary: 'Change a motorcycle status.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: VehicleStatusResponseDto })
  @ApiNotFound()
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVehicleStatusDto,
  ) {
    return this.motorcyclesService.changeStatus(id, dto.status);
  }

  @Delete(':id')
  @RequirePermissions('motorcycle:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a motorcycle.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiNoContentResponse({
    description: 'Motorcycle deleted successfully.',
  })
  @ApiNotFound()
  @ApiConflict()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.motorcyclesService.remove(id);
  }
}
