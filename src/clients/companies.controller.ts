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
import { UpdateStatusDto } from '../common/dto/update-status.dto';
import { CountResponseDto } from '../common/dto/count-response.dto';
import { EnabledResponseDto } from '../common/dto/enabled-response.dto';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyQueryDto } from './dto/company-query.dto';
import { CompanyResponseDto } from './dto/company-response.dto';

@ApiTags('companies')
@ApiBearerAuth()
@ApiAuthErrors()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @RequirePermissions('company:create')
  @ApiOperation({ summary: 'Create a company client.' })
  @ApiCreatedResponse({
    type: CompanyResponseDto,
    description: 'Company created successfully.',
  })
  @ApiBadRequest()
  @ApiConflict()
  create(@Body() dto: CreateCompanyDto): Promise<CompanyResponseDto> {
    return this.companiesService.create(dto);
  }

  @Get()
  @RequirePermissions('company:read')
  @ApiOperation({ summary: 'List companies with filters and pagination.' })
  @ApiPaginatedResponse(CompanyResponseDto, 'Paginated list of companies.')
  findAll(
    @Query() query: CompanyQueryDto,
  ): Promise<PageResponseDto<CompanyResponseDto>> {
    return this.companiesService.findAll(query);
  }

  @Get('count')
  @RequirePermissions('company:read')
  @ApiOperation({ summary: 'Company count statistics.' })
  @ApiOkResponse({
    type: CountResponseDto,
    description: 'Totals of active and inactive companies.',
  })
  count(): Promise<CountResponseDto> {
    return this.companiesService.count();
  }

  @Get(':id')
  @RequirePermissions('company:read')
  @ApiOperation({ summary: 'Get a company by id.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: CompanyResponseDto })
  @ApiNotFound()
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CompanyResponseDto> {
    return this.companiesService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('company:update')
  @ApiOperation({ summary: 'Update a company.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({
    type: CompanyResponseDto,
    description: 'Company updated successfully.',
  })
  @ApiBadRequest()
  @ApiNotFound()
  @ApiConflict()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyDto,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.update(id, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('company:update')
  @ApiOperation({ summary: 'Enable or disable a company.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: EnabledResponseDto })
  @ApiNotFound()
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ): Promise<{ enabled: boolean }> {
    return this.companiesService.changeStatus(id, dto.enabled);
  }

  @Delete(':id')
  @RequirePermissions('company:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a company.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiNoContentResponse({ description: 'Company deleted successfully.' })
  @ApiNotFound()
  @ApiConflict()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.companiesService.remove(id);
  }
}
