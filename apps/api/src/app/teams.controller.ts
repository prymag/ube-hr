import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse } from '@nestjs/swagger';
import {
  TeamsService,
  CreateTeamDto,
  UpdateTeamDto,
  TeamResponseDto,
  TeamMemberDto,
  AddMemberDto,
  PermissionGuard,
  RequirePermission,
  AuthenticatedRequest,
  PERMISSIONS,
} from '@ube-hr/feature';

@ApiTags('teams')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  // --- Teams CRUD ---

  @Post()
  @RequirePermission(PERMISSIONS.TEAMS_CREATE)
  @ApiOperation({ summary: 'Create a team' })
  @ApiCreatedResponse({ type: TeamResponseDto })
  create(@Body() dto: CreateTeamDto, @Req() req: AuthenticatedRequest) {
    return this.teamsService.create(dto, req.user!.id);
  }

  @Get()
  @RequirePermission(PERMISSIONS.TEAMS_READ)
  @ApiOperation({ summary: 'List all teams' })
  @ApiOkResponse({ type: [TeamResponseDto] })
  findAll() {
    return this.teamsService.findAll();
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.TEAMS_READ)
  @ApiOperation({ summary: 'Get team details' })
  @ApiOkResponse({ type: TeamResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.findById(id);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.TEAMS_UPDATE)
  @ApiOperation({ summary: 'Update a team' })
  @ApiOkResponse({ type: TeamResponseDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTeamDto) {
    return this.teamsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.TEAMS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a team' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.remove(id);
  }

  // --- Membership ---

  @Get(':teamId/users')
  @RequirePermission(PERMISSIONS.TEAMS_READ)
  @ApiOperation({ summary: 'List users in a team' })
  @ApiOkResponse({ type: [TeamMemberDto] })
  getMembers(@Param('teamId', ParseIntPipe) teamId: number, @Req() req: AuthenticatedRequest) {
    return this.teamsService.getMembers(teamId, req.user!.role);
  }

  @Post(':teamId/users')
  @RequirePermission(PERMISSIONS.TEAMS_UPDATE)
  @ApiOperation({ summary: 'Add a user to a team' })
  @ApiCreatedResponse()
  addMember(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() dto: AddMemberDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teamsService.addMember(teamId, dto.userId, req.user!.role);
  }

  @Delete(':teamId/users/:userId')
  @RequirePermission(PERMISSIONS.TEAMS_UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a user from a team' })
  @ApiNoContentResponse()
  removeMember(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.teamsService.removeMember(teamId, userId);
  }
}
