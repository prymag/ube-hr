import { Controller, Get, Post, Delete, Param, ParseEnumPipe, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiNoContentResponse } from '@nestjs/swagger';
import { Role } from '@ube-hr/backend';
import {
  PermissionsService,
  PermissionGuard,
  RequirePermission
} from '@ube-hr/feature';
import {
  Permission,
    ALL_PERMISSIONS,
    PERMISSIONS,
} from '@ube-hr/shared'

@ApiTags('permissions')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@RequirePermission(PERMISSIONS.ADMINS_MANAGE)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all permissions grouped by role' })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } } })
  getAll() {
    return this.permissionsService.getAll();
  }

  @Get('available')
  @ApiOperation({ summary: 'List all available permission strings' })
  @ApiOkResponse({ schema: { type: 'array', items: { type: 'string' } } })
  getAvailable() {
    return ALL_PERMISSIONS;
  }

  @Get(':role')
  @ApiOperation({ summary: 'List permissions for a role' })
  @ApiOkResponse({ schema: { type: 'array', items: { type: 'string' } } })
  getForRole(@Param('role', new ParseEnumPipe(Role)) role: Role) {
    return this.permissionsService.getForRole(role);
  }

  @Post(':role/:permission')
  @ApiOperation({ summary: 'Grant a permission to a role' })
  grant(
    @Param('role', new ParseEnumPipe(Role)) role: Role,
    @Param('permission') permission: Permission,
  ) {
    return this.permissionsService.grant(role, permission);
  }

  @Delete(':role/:permission')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a permission from a role' })
  @ApiNoContentResponse()
  revoke(
    @Param('role', new ParseEnumPipe(Role)) role: Role,
    @Param('permission') permission: Permission,
  ) {
    return this.permissionsService.revoke(role, permission);
  }
}
