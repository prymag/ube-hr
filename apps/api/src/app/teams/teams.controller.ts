import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse, ApiQuery } from '@nestjs/swagger';
import {
  TeamsService,
  PermissionGuard,
  RequirePermission,
  AuthenticatedRequest,
  type TeamMemberRecord,
  type TeamWithMembersRecord,
} from '@ube-hr/feature';
import { PERMISSIONS } from '@ube-hr/shared';
import { type TeamModel } from '@ube-hr/backend';
import { type TeamResponse, type TeamMember, type MyTeamResponse, type PaginatedResponse } from '@ube-hr/shared';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamResponseDto, TeamMemberDto, MyTeamResponseDto } from './dto/team-response.dto';
import { AddMemberDto } from './dto/add-member.dto';

function toTeamResponse(team: TeamModel): TeamResponse {
  return {
    id: team.id,
    name: team.name,
    description: team.description,
    ownerId: team.ownerId,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
  };
}

function toTeamMember(m: TeamMemberRecord): TeamMember {
  return { id: m.id, email: m.email, name: m.name, positionName: m.positionName, joinedAt: m.joinedAt.toISOString() };
}

function toMyTeamResponse(t: TeamWithMembersRecord): MyTeamResponse {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    ownerId: t.ownerId,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    members: t.members.map(toTeamMember),
  };
}

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
  async create(@Body() dto: CreateTeamDto, @Req() req: AuthenticatedRequest): Promise<TeamResponse> {
    const team = await this.teamsService.create(dto, req.user!.id);
    return toTeamResponse(team);
  }

  @Get()
  @RequirePermission(PERMISSIONS.TEAMS_READ)
  @ApiOperation({ summary: 'List teams with search, sort and pagination' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortField', required: false })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('sortField') sortField?: string,
    @Query('sortDir') sortDir?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PaginatedResponse<TeamResponse>> {
    const result = await this.teamsService.findAll(
      { search, sortField, sortDir, page, pageSize },
      req.user!.id,
      req.user!.role,
    );
    return { ...result, data: result.data.map(toTeamResponse) };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get teams the authenticated user is a member of' })
  @ApiOkResponse({ type: [MyTeamResponseDto] })
  async getMyTeams(@Req() req: AuthenticatedRequest): Promise<MyTeamResponse[]> {
    const teams = await this.teamsService.getMyTeams(req.user!.id, req.user!.role);
    return teams.map(toMyTeamResponse);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.TEAMS_READ)
  @ApiOperation({ summary: 'Get team details' })
  @ApiOkResponse({ type: TeamResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<TeamResponse> {
    const team = await this.teamsService.findById(id);
    return toTeamResponse(team);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.TEAMS_UPDATE)
  @ApiOperation({ summary: 'Update a team' })
  @ApiOkResponse({ type: TeamResponseDto })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTeamDto): Promise<TeamResponse> {
    const team = await this.teamsService.update(id, dto);
    return toTeamResponse(team);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.TEAMS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a team' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.teamsService.remove(id);
  }

  // --- Membership ---

  @Get(':teamId/users')
  @RequirePermission(PERMISSIONS.TEAMS_READ)
  @ApiOperation({ summary: 'List users in a team' })
  @ApiOkResponse({ type: [TeamMemberDto] })
  async getMembers(@Param('teamId', ParseIntPipe) teamId: number, @Req() req: AuthenticatedRequest): Promise<TeamMember[]> {
    const members = await this.teamsService.getMembers(teamId, req.user!.role);
    return members.map(toTeamMember);
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
  ): Promise<void> {
    return this.teamsService.removeMember(teamId, userId);
  }
}
