import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiAuthErrors } from '../common/decorators/api-problem-responses.decorator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { PermissionsService } from './permissions.service';
import { PermissionResponseDto } from './dto/permission-response.dto';

@ApiTags('permissions')
@ApiBearerAuth()
@ApiAuthErrors()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions('permission:read')
  @ApiOperation({ summary: 'List the permission catalog (read-only).' })
  @ApiOkResponse({ type: [PermissionResponseDto] })
  findAll(): Promise<PermissionResponseDto[]> {
    return this.permissionsService.findAll();
  }
}
