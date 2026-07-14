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
import { AllowSelf } from '../common/decorators/allow-self.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserCountDto, UserResponseDto } from './dto/user-response.dto';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { UpdateStatusDto } from '../common/dto/update-status.dto';
import { EnabledResponseDto } from '../common/dto/enabled-response.dto';
import type { RequestUser } from '../auth/types/request-user.type';

@ApiTags('users')
@ApiBearerAuth()
@ApiAuthErrors()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions('user:create')
  @ApiOperation({
    summary: 'Create a user. The USER role is assigned by default.',
  })
  @ApiCreatedResponse({
    type: UserResponseDto,
    description: 'User created successfully.',
  })
  @ApiBadRequest()
  @ApiConflict()
  create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get()
  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'List users with filters and pagination.' })
  @ApiPaginatedResponse(UserResponseDto, 'Paginated list of users.')
  findAll(
    @Query() query: UserQueryDto,
  ): Promise<PageResponseDto<UserResponseDto>> {
    return this.usersService.findAll(query);
  }

  @Get('count')
  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'User count statistics.' })
  @ApiOkResponse({
    type: UserCountDto,
    description: 'Active and inactive user totals.',
  })
  count(): Promise<UserCountDto> {
    return this.usersService.count();
  }

  @Get(':id')
  @RequirePermissions('user:read')
  @AllowSelf('id')
  @ApiOperation({ summary: 'Get a user by id.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFound()
  findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('user:update')
  @AllowSelf('id')
  @ApiOperation({
    summary:
      'Update a user. Users may edit their own profile, but only holders of user:update may change roles.',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({
    type: UserResponseDto,
    description: 'User updated successfully.',
  })
  @ApiBadRequest()
  @ApiNotFound()
  @ApiConflict()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: RequestUser,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto, currentUser);
  }

  @Patch(':id/status')
  @RequirePermissions('user:update')
  @ApiOperation({ summary: 'Enable or disable a user.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: EnabledResponseDto })
  @ApiNotFound()
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ): Promise<{ enabled: boolean }> {
    return this.usersService.changeStatus(id, dto.enabled);
  }

  @Delete(':id')
  @RequirePermissions('user:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user.' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiNoContentResponse({ description: 'User deleted successfully.' })
  @ApiNotFound()
  @ApiConflict()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}
