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
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { ReplacePermissionsDto } from './dto/replace-permissions.dto';
import { RoleResponseDto } from './dto/role-response.dto';

@ApiTags('roles')
@ApiBearerAuth()
@ApiAuthErrors()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('role:read')
  @ApiOperation({ summary: 'List all roles with their permissions.' })
  @ApiOkResponse({ type: [RoleResponseDto] })
  findAll(): Promise<RoleResponseDto[]> {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('role:read')
  @ApiOperation({ summary: 'Get a role by id.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: RoleResponseDto })
  @ApiNotFound()
  findOne(@Param('id', ParseIntPipe) id: number): Promise<RoleResponseDto> {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermissions('role:create')
  @ApiOperation({ summary: 'Create a role.' })
  @ApiCreatedResponse({
    type: RoleResponseDto,
    description: 'Role created successfully.',
  })
  @ApiBadRequest()
  @ApiConflict()
  create(@Body() dto: CreateRoleDto): Promise<RoleResponseDto> {
    return this.rolesService.create(dto);
  }

  @Put(':id/permissions')
  @RequirePermissions('role:update')
  @ApiOperation({
    summary: "Replace a role's permission set.",
    description:
      'expectedUpdatedAt must match the value from GET /roles/:id; a mismatch means someone else changed the role meanwhile and returns 409.',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({
    type: RoleResponseDto,
    description: 'Role permissions updated successfully.',
  })
  @ApiBadRequest()
  @ApiNotFound()
  @ApiConflict()
  replacePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplacePermissionsDto,
  ): Promise<RoleResponseDto> {
    return this.rolesService.replacePermissions(
      id,
      dto.permissionNames,
      new Date(dto.expectedUpdatedAt),
    );
  }

  @Delete(':id')
  @RequirePermissions('role:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a role.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiNoContentResponse({ description: 'Role deleted successfully.' })
  @ApiNotFound()
  @ApiConflict()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.rolesService.remove(id);
  }
}
