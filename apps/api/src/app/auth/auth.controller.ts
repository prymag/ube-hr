import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  AuthService,
  LocalAuthGuard,
  PermissionGuard,
  RequirePermission,
  AuthenticatedRequest,
  PermissionsService,
} from '@ube-hr/feature';
import { PERMISSIONS } from '@ube-hr/shared';
import { type MeResponse } from '@ube-hr/shared';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';

const REFRESH_COOKIE = 'refresh_token';

const cookieOptions = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: TokenResponseDto })
  async login(
    @Req() req: AuthenticatedRequest,
    @Body() _body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token } = await this.authService.login(
      req.user!,
    );
    res.cookie(REFRESH_COOKIE, refresh_token, cookieOptions);
    return { access_token };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange refresh token cookie for a new token pair',
  })
  @ApiOkResponse({ type: TokenResponseDto })
  async refresh(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req as any).cookies?.[REFRESH_COOKIE];
    if (!token) throw new UnauthorizedException('Missing refresh token');

    const { access_token, refresh_token } =
      await this.authService.refresh(token);
    res.cookie(REFRESH_COOKIE, refresh_token, cookieOptions);
    return { access_token };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiOkResponse({
    schema: {
      properties: {
        message: { type: 'string', example: 'Logged out successfully' },
      },
    },
  })
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.user!.id);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    return { message: 'Logged out successfully' };
  }

  @Post('impersonate/:userId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(PermissionGuard)
  @RequirePermission(PERMISSIONS.AUTH_IMPERSONATE)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Issue a 30-minute impersonation token for a target user (admin only)',
  })
  @ApiOkResponse({ type: TokenResponseDto })
  impersonate(
    @Req() req: AuthenticatedRequest,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.authService.impersonate(req.user!.id, userId);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  async me(@Req() req: AuthenticatedRequest): Promise<MeResponse> {
    const permissions = await this.permissionsService.getForRole(
      req.user!.role,
    );
    return {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role as MeResponse['role'],
      profilePicture: req.user!.profilePicture,
      impersonatedBy: req.user!.impersonatedBy,
      permissions,
    };
  }
}
