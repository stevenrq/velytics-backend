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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PageResponseDto } from '../common/dto/page-response.dto';
import type { RequestUser } from '../auth/types/request-user.type';
import { PurchaseSalesService } from './purchase-sales.service';
import { CreatePurchaseSaleDto } from './dto/create-purchase-sale.dto';
import { UpdatePurchaseSaleDto } from './dto/update-purchase-sale.dto';
import { PurchaseSaleQueryDto } from './dto/purchase-sale-query.dto';
import {
  PurchaseSaleDetailResponseDto,
  PurchaseSaleResponseDto,
} from './dto/purchase-sale-response.dto';
import { ContractStatusHistoryResponseDto } from './dto/status-history-response.dto';

@ApiTags('purchase-sales')
@ApiBearerAuth()
@ApiAuthErrors()
@Controller('purchase-sales')
export class PurchaseSalesController {
  constructor(private readonly purchaseSalesService: PurchaseSalesService) {}

  @Post()
  @RequirePermissions('purchase_sale:create')
  @ApiOperation({ summary: 'Create a purchase or sale contract.' })
  @ApiCreatedResponse({
    type: PurchaseSaleResponseDto,
    description: 'Contract created successfully.',
  })
  @ApiBadRequest()
  @ApiNotFound()
  @ApiConflict()
  create(
    @Body() dto: CreatePurchaseSaleDto,
    @CurrentUser() currentUser: RequestUser,
  ): Promise<PurchaseSaleResponseDto> {
    return this.purchaseSalesService.create(dto, currentUser.id);
  }

  @Get()
  @RequirePermissions('purchase_sale:read')
  @AllowServiceKey()
  @ApiOperation({
    summary:
      'List/search contracts with filters and pagination (or via X-Service-Key for ML). If detailed=true, each item includes clientSummary/userSummary/vehicleSummary.',
  })
  @ApiPaginatedResponse(
    PurchaseSaleDetailResponseDto,
    'Paginated list of contracts.',
  )
  findAll(
    @Query() query: PurchaseSaleQueryDto,
  ): Promise<
    PageResponseDto<PurchaseSaleResponseDto | PurchaseSaleDetailResponseDto>
  > {
    return this.purchaseSalesService.findAll(query);
  }

  @Get('available-vehicles')
  @RequirePermissions('purchase_sale:read')
  @ApiOperation({ summary: 'IDs of purchased vehicles not yet sold.' })
  @ApiOkResponse({
    type: [Number],
    description: 'IDs of vehicles available for sale.',
    schema: {
      type: 'array',
      items: { type: 'integer' },
      example: [10, 12, 15],
    },
  })
  availableVehicles(): Promise<number[]> {
    return this.purchaseSalesService.availableVehicleIds();
  }

  @Get(':id')
  @RequirePermissions('purchase_sale:read')
  @ApiOperation({ summary: 'Get a contract by id (detailed).' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: PurchaseSaleDetailResponseDto })
  @ApiNotFound()
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PurchaseSaleDetailResponseDto> {
    return this.purchaseSalesService.findOne(id);
  }

  @Get(':id/status-history')
  @RequirePermissions('purchase_sale:read')
  @ApiOperation({ summary: 'Status change history of a contract.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: [ContractStatusHistoryResponseDto] })
  @ApiNotFound()
  statusHistory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ContractStatusHistoryResponseDto[]> {
    return this.purchaseSalesService.statusHistoryFor(id);
  }

  @Put(':id')
  @RequirePermissions('purchase_sale:update')
  @ApiOperation({
    summary: 'Update a contract. The contract type is immutable.',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({
    type: PurchaseSaleResponseDto,
    description: 'Contract updated successfully.',
  })
  @ApiBadRequest()
  @ApiNotFound()
  @ApiConflict()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseSaleDto,
    @CurrentUser() currentUser: RequestUser,
  ): Promise<PurchaseSaleResponseDto> {
    return this.purchaseSalesService.update(id, dto, currentUser.id);
  }

  @Delete(':id')
  @RequirePermissions('purchase_sale:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a contract (only when in CANCELED state).',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiNoContentResponse({ description: 'Contract deleted successfully.' })
  @ApiNotFound()
  @ApiConflict()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.purchaseSalesService.remove(id);
  }
}
