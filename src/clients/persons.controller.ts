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
import { PersonsService } from './persons.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonQueryDto } from './dto/person-query.dto';
import { PersonResponseDto } from './dto/person-response.dto';

@ApiTags('persons')
@ApiBearerAuth()
@ApiAuthErrors()
@Controller('persons')
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  @Post()
  @RequirePermissions('person:create')
  @ApiOperation({ summary: 'Create a natural-person client.' })
  @ApiCreatedResponse({
    type: PersonResponseDto,
    description: 'Person created successfully.',
  })
  @ApiBadRequest()
  @ApiConflict()
  create(@Body() dto: CreatePersonDto): Promise<PersonResponseDto> {
    return this.personsService.create(dto);
  }

  @Get()
  @RequirePermissions('person:read')
  @ApiOperation({ summary: 'List persons with filters and pagination.' })
  @ApiPaginatedResponse(PersonResponseDto, 'Paginated list of persons.')
  findAll(
    @Query() query: PersonQueryDto,
  ): Promise<PageResponseDto<PersonResponseDto>> {
    return this.personsService.findAll(query);
  }

  @Get('count')
  @RequirePermissions('person:read')
  @ApiOperation({ summary: 'Person count statistics.' })
  @ApiOkResponse({
    type: CountResponseDto,
    description: 'Totals of active and inactive persons.',
  })
  count(): Promise<CountResponseDto> {
    return this.personsService.count();
  }

  @Get(':id')
  @RequirePermissions('person:read')
  @ApiOperation({ summary: 'Get a person by id.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: PersonResponseDto })
  @ApiNotFound()
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PersonResponseDto> {
    return this.personsService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('person:update')
  @ApiOperation({ summary: 'Update a person.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({
    type: PersonResponseDto,
    description: 'Person updated successfully.',
  })
  @ApiBadRequest()
  @ApiNotFound()
  @ApiConflict()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePersonDto,
  ): Promise<PersonResponseDto> {
    return this.personsService.update(id, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('person:update')
  @ApiOperation({ summary: 'Enable or disable a person.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: EnabledResponseDto })
  @ApiNotFound()
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ): Promise<{ enabled: boolean }> {
    return this.personsService.changeStatus(id, dto.enabled);
  }

  @Delete(':id')
  @RequirePermissions('person:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a person.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiNoContentResponse({ description: 'Person deleted successfully.' })
  @ApiNotFound()
  @ApiConflict()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.personsService.remove(id);
  }
}
