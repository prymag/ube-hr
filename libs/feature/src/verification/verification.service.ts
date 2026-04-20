import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@ube-hr/backend';

export enum VerificationType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
}

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async generateCode(userId: number, type: VerificationType) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Clear old codes of the same type for this user
    await this.prisma.verificationCode.deleteMany({
      where: { userId, type },
    });

    await this.prisma.verificationCode.create({
      data: {
        userId,
        code,
        type,
        expiresAt,
      },
    });

    console.log(
      `[Verification] Code for ${type} update (User ${userId}): ${code}`,
    );
    return { success: true };
  }

  async verifyCode(userId: number, type: VerificationType, code: string) {
    const verification = await this.prisma.verificationCode.findFirst({
      where: {
        userId,
        type,
        code,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verification) {
      throw new BadRequestException('Invalid or expired security code');
    }

    await this.prisma.verificationCode.delete({
      where: { id: verification.id },
    });

    return true;
  }
}
