import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import {
  UsersService,
  PermissionGuard,
  RequirePermission,
  AuthenticatedRequest,
  type UserRecord,
} from '@ube-hr/feature';
import { PERMISSIONS } from '@ube-hr/shared';
import { type UserResponse, type UserTeam, type PaginatedResponse } from '@ube-hr/shared';
import { CreateUserDto } from './users/dto/create-user.dto';
import { UserResponseDto } from './users/dto/user-response.dto';

function toUserResponse(user: UserRecord): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserResponse['role'],
    status: user.status as UserResponse['status'],
    createdAt: user.createdAt.toISOString(),
  };
}

function toUserTeam(t: { id: number; name: string; description: string | null; joinedAt: Date }): UserTeam {
  return { id: t.id, name: t.name, description: t.description, joinedAt: t.joinedAt.toISOString() };
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermission(PERMISSIONS.USERS_CREATE)
  @ApiOperation({ summary: 'Create a user' })
  @ApiCreatedResponse({ type: UserResponseDto })
  async create(@Body() dto: CreateUserDto, @Req() req: AuthenticatedRequest): Promise<UserResponse> {
    const user = await this.usersService.create(dto, req.user!.role);
    return toUserResponse(user);
  }

  @Get()
  @RequirePermission(PERMISSIONS.USERS_READ)
  @ApiOperation({ summary: 'List users with search, filter, sort and pagination' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'sortField', required: false })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('sortField') sortField?: string,
    @Query('sortDir') sortDir?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PaginatedResponse<UserResponse>> {
    const result = await this.usersService.findAll(req.user!.role, { search, role, status, sortField, sortDir, page, pageSize });
    return { ...result, data: result.data.map(toUserResponse) };
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.USERS_READ)
  @ApiOperation({ summary: 'Get user details' })
  @ApiOkResponse({ type: UserResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserResponse | null> {
    const user = await this.usersService.findById(id);
    return user ? toUserResponse(user) : null;
  }

  @Get(':id/teams')
  @RequirePermission(PERMISSIONS.USERS_READ)
  @ApiOperation({ summary: 'List teams for a user' })
  async findTeams(@Param('id', ParseIntPipe) id: number): Promise<UserTeam[]> {
    const teams = await this.usersService.findTeams(id);
    return teams.map(toUserTeam);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.USERS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest): Promise<void> {
    return this.usersService.remove(id, req.user!.role);
  }
}
