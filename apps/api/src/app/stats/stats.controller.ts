import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { StatsService, PermissionGuard, RequirePermission } from '@ube-hr/feature';
import { PERMISSIONS, type StatsResponse } from '@ube-hr/shared';

@ApiTags('stats')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.USERS_READ)
  @ApiOperation({ summary: 'Get org-wide stats' })
  @ApiOkResponse({ description: 'Org-wide counts' })
  getStats(): Promise<StatsResponse> {
    return this.statsService.getStats();
  }
}
