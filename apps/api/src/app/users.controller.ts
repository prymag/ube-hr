import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import {
  UsersService,
  UserResponseDto,
  CreateUserDto,
  PermissionGuard,
  RequirePermission,
  AuthenticatedRequest,
  PERMISSIONS,
} from '@ube-hr/feature';

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
  create(@Body() dto: CreateUserDto, @Req() req: AuthenticatedRequest) {
    return this.usersService.create(dto, req.user!.role);
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
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('sortField') sortField?: string,
    @Query('sortDir') sortDir?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.usersService.findAll(req.user!.role, { search, role, status, sortField, sortDir, page, pageSize });
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.USERS_READ)
  @ApiOperation({ summary: 'Get user details' })
  @ApiOkResponse({ type: UserResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Get(':id/teams')
  @RequirePermission(PERMISSIONS.USERS_READ)
  @ApiOperation({ summary: 'List teams for a user' })
  findTeams(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findTeams(id);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.USERS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.usersService.remove(id, req.user!.role);
  }
}
