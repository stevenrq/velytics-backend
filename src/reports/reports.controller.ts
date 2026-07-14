import { Controller, Get, Param, Query, StreamableFile } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiAuthErrors,
  ApiBadRequest,
} from '../common/decorators/api-problem-responses.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { ReportsService, ReportFormat } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { InvalidReportFormatException } from './exceptions/report.exceptions';

const VALID_FORMATS: ReportFormat[] = ['pdf', 'excel', 'csv'];

@ApiTags('reports')
@ApiBearerAuth()
@ApiAuthErrors()
@Controller('purchase-sales/report')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(':format')
  @RequirePermissions('purchase_sale:read')
  @ApiOperation({ summary: 'Export contracts as PDF, Excel or CSV.' })
  @ApiParam({ name: 'format', enum: VALID_FORMATS, example: 'pdf' })
  @ApiProduces(
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  )
  @ApiOkResponse({
    description: 'Binary file containing the generated report.',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiBadRequest()
  async generate(
    @Param('format') format: string,
    @Query() query: ReportQueryDto,
  ): Promise<StreamableFile> {
    if (!VALID_FORMATS.includes(format as ReportFormat)) {
      throw new InvalidReportFormatException(format);
    }

    const report = await this.reportsService.generate(
      format as ReportFormat,
      query.startDate,
      query.endDate,
    );

    return new StreamableFile(report.buffer, {
      type: report.contentType,
      disposition: `attachment; filename="${report.filename}"`,
    });
  }
}
