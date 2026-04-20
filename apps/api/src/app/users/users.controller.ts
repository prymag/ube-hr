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
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Patch,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import {
  UsersService,
  PermissionGuard,
  RequirePermission,
  AuthenticatedRequest,
  type UserRecord,
  VerificationService,
  VerificationType,
} from '@ube-hr/feature';
import { StorageService } from '@ube-hr/backend';
import { PERMISSIONS } from '@ube-hr/shared';
import {
  type UserResponse,
  type UserTeam,
  type PaginatedResponse,
  parseFormInt,
} from '@ube-hr/shared';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { RequestVerificationCodeDto } from './dto/request-verification-code.dto';
import { VerifyAndUpdateContactDto } from './dto/verify-and-update-contact.dto';

function toUserResponse(
  user: UserRecord,
  storageService: StorageService,
): UserResponse {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    name: user.name,
    role: user.role as UserResponse['role'],
    status: user.status as UserResponse['status'],
    profilePicture: user.profilePicture
      ? storageService.getUrl(user.profilePicture)
      : null,
    positionId: user.positionId,
    positionName: user.position?.name ?? null,
    departmentId: user.departmentId,
    departmentName: user.department?.name ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

function toUserTeam(t: {
  id: number;
  name: string;
  description: string | null;
  joinedAt: Date;
}): UserTeam {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    joinedAt: t.joinedAt.toISOString(),
  };
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(PermissionGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
    private readonly verificationService: VerificationService,
  ) {}

  @Post()
  @RequirePermission(PERMISSIONS.USERS_CREATE)
  @ApiOperation({ summary: 'Create a user' })
  @ApiCreatedResponse({ type: UserResponseDto })
  async create(
    @Body() dto: CreateUserDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponse> {
    const user = await this.usersService.create(dto, req.user!.role);
    return toUserResponse(user, this.storageService);
  }

  @Get()
  @RequirePermission(PERMISSIONS.USERS_READ)
  @ApiOperation({
    summary: 'List users with search, filter, sort and pagination',
  })
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
    const result = await this.usersService.findAll(req.user!.role, {
      search,
      role,
      status,
      sortField,
      sortDir,
      page,
      pageSize,
    });
    return {
      ...result,
      data: result.data.map((u) => toUserResponse(u, this.storageService)),
    };
  }

  @Post('me/verification-code')
  @ApiOperation({
    summary: 'Request a security code for updating own email or phone',
  })
  @ApiOkResponse()
  async requestCode(
    @Body() dto: RequestVerificationCodeDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    return this.verificationService.generateCode(req.user!.id, dto.type);
  }

  @Patch('me/verify-and-update')
  @ApiOperation({
    summary: 'Verify security code and update own email or phone',
  })
  @ApiOkResponse({ type: UserResponseDto })
  async verifyAndUpdate(
    @Body() dto: VerifyAndUpdateContactDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponse> {
    await this.verificationService.verifyCode(req.user!.id, dto.type, dto.code);

    const updateData: any = {};
    if (dto.type === VerificationType.EMAIL) {
      if (!dto.value) throw new BadRequestException('Email value is required');
      updateData.email = dto.value;
    } else if (dto.type === VerificationType.PHONE) {
      if (!dto.value) throw new BadRequestException('Phone value is required');
      updateData.phone = dto.value;
    }

    const user = await this.usersService.update(
      req.user!.id,
      updateData,
      req.user!.role,
    );
    return toUserResponse(user, this.storageService);
  }

  @Post(':id/verification-code')
  @RequirePermission(PERMISSIONS.USERS_UPDATE)
  @ApiOperation({
    summary:
      "Request a security code for updating a user's email or phone (sent to admin)",
  })
  @ApiOkResponse()
  async requestCodeForUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RequestVerificationCodeDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean }> {
    const targetUser = await this.usersService.findById(id);
    if (!targetUser) throw new NotFoundException('User not found');

    // The security code is sent to the ADMIN who is performing the update
    return this.verificationService.generateCode(req.user!.id, dto.type);
  }

  @Patch(':id/verify-and-update')
  @RequirePermission(PERMISSIONS.USERS_UPDATE)
  @ApiOperation({
    summary: "Verify admin security code and update a user's email or phone",
  })
  @ApiOkResponse({ type: UserResponseDto })
  async verifyAndUpdateForUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VerifyAndUpdateContactDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponse> {
    // Verify the code for the ADMIN
    await this.verificationService.verifyCode(req.user!.id, dto.type, dto.code);

    const updateData: any = {};
    if (dto.type === VerificationType.EMAIL) {
      if (!dto.value) throw new BadRequestException('Email value is required');
      updateData.email = dto.value;
    } else if (dto.type === VerificationType.PHONE) {
      if (!dto.value) throw new BadRequestException('Phone value is required');
      updateData.phone = dto.value;
    }

    // Permission check (role hierarchy) is handled inside usersService.update
    const user = await this.usersService.update(id, updateData, req.user!.role);
    return toUserResponse(user, this.storageService);
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.USERS_READ)
  @ApiOperation({ summary: 'Get user details' })
  @ApiOkResponse({ type: UserResponseDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponse | null> {
    const user = await this.usersService.findUserRecordById(id);
    return user ? toUserResponse(user, this.storageService) : null;
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
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.usersService.remove(id, req.user!.role);
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.USERS_UPDATE)
  @ApiOperation({ summary: 'Update user details and profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ type: UserResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponse> {
    let profilePicturePath: string | null | undefined = undefined;

    if (file) {
      profilePicturePath = await this.storageService.upload(
        file,
        'profile_pictures',
      );
    } else if (dto.profilePicture === 'null') {
      profilePicturePath = null;
    }

    const user = await this.usersService.update(
      id,
      {
        name: dto.name,
        role: dto.role,
        profilePicture: profilePicturePath,
        positionId: parseFormInt(dto.positionId),
        departmentId: parseFormInt(dto.departmentId),
      },
      req.user!.role,
    );

    return toUserResponse(user, this.storageService);
  }
}
