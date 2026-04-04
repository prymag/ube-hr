import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

interface RefreshPayload {
  sub: number;
  ver: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    return this.usersService.findByEmailAndPassword(email, password);
  }

  async login(user: { id: number; email: string }) {
    const newVersion = await this.usersService.incrementTokenVersion(user.id);
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user),
      this.signRefreshToken(user.id, newVersion),
    ]);
    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async refresh(rawToken: string) {
    let payload: RefreshPayload;
    try {
      payload = this.jwtService.verify<RefreshPayload>(rawToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException();

    if (payload.ver !== user.refreshTokenVersion) {
      // Reuse detected — invalidate all sessions for this user
      await this.usersService.incrementTokenVersion(user.id);
      throw new UnauthorizedException('Token reuse detected');
    }

    const newVersion = await this.usersService.incrementTokenVersion(user.id);
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user),
      this.signRefreshToken(user.id, newVersion),
    ]);
    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async logout(userId: number) {
    await this.usersService.incrementTokenVersion(userId);
  }

  private signAccessToken(user: { id: number; email: string }) {
    return this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: '15m',
      },
    );
  }

  private signRefreshToken(userId: number, version: number) {
    return this.jwtService.signAsync(
      { sub: userId, ver: version },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );
  }
}
