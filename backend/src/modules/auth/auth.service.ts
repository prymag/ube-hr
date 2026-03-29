import * as bcrypt from 'bcryptjs';
import jwt, { SignOptions, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import type { StringValue } from 'ms';

/**
 * Token payload interface
 */
export interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * Generated tokens interface
 */
export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Auth Service - Handles password hashing, comparison, and JWT token operations
 * Implements security best practices for password and token management
 */
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiry: StringValue;
  private readonly refreshExpiry: StringValue;

  constructor(
    accessSecret: string = process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    refreshSecret: string = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    accessExpiry: StringValue = (process.env.JWT_ACCESS_EXPIRY || '15m') as StringValue,
    refreshExpiry: StringValue = (process.env.JWT_REFRESH_EXPIRY || '7d') as StringValue,
  ) {
    this.accessSecret = accessSecret;
    this.refreshSecret = refreshSecret;
    this.accessExpiry = accessExpiry;
    this.refreshExpiry = refreshExpiry;
  }

  /**
   * Hash a plain text password using bcryptjs
   * @param password - Plain text password to hash
   * @param saltRounds - Number of salt rounds (default: 10, minimum required)
   * @returns Promise<string> - Hashed password
   */
  async hashPassword(password: string, saltRounds: number = 10): Promise<string> {
    if (saltRounds < 10) {
      throw new Error('Salt rounds must be at least 10 for security');
    }
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare plain text password with a bcrypt hash
   * @param plainPassword - Plain text password to verify
   * @param hashedPassword - Bcrypt hash to compare against
   * @returns Promise<boolean> - True if passwords match, false otherwise
   */
  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Generate both access and refresh JWT tokens
   * @param user - User payload object with userId and email
   * @returns Promise<GeneratedTokens> - Object containing both access and refresh tokens
   */
  async generateTokens(user: TokenPayload): Promise<GeneratedTokens> {
    const signOptions: SignOptions = {
      expiresIn: this.accessExpiry,
    };

    const accessToken = jwt.sign(user, this.accessSecret, signOptions);

    const refreshSignOptions: SignOptions = {
      expiresIn: this.refreshExpiry,
    };

    const refreshToken = jwt.sign(user, this.refreshSecret, refreshSignOptions);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Verify and decode an access token
   * @param token - JWT access token to verify
   * @returns Promise<TokenPayload> - Decoded token payload
   * @throws Error if token is invalid or expired
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.accessSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new Error('Access token has expired');
      } else if (error instanceof JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  /**
   * Verify and decode a refresh token
   * @param token - JWT refresh token to verify
   * @returns Promise<TokenPayload> - Decoded token payload
   * @throws Error if token is invalid or expired
   */
  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.refreshSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new Error('Refresh token has expired');
      } else if (error instanceof JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }
}
