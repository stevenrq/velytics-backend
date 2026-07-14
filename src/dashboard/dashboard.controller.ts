import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiAuthErrors } from '../common/decorators/api-problem-responses.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@ApiAuthErrors()
@Controller('purchase-sales')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard-summary')
  @RequirePermissions('purchase_sale:read')
  @ApiOperation({ summary: 'Aggregated dashboard summary (60s cache).' })
  @ApiOkResponse({ type: DashboardSummaryDto })
  getSummary(): Promise<DashboardSummaryDto> {
    return this.dashboardService.getSummary();
  }
}
