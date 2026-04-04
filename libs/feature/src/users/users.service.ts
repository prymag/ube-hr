import { Injectable } from '@nestjs/common';
import { secrets } from '@ube-hr/shared';
import { PrismaService } from '@ube-hr/backend';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmailAndPassword(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const valid = await secrets.verify(user.password, password);
    if (!valid) return null;

    return user;
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async incrementTokenVersion(id: number) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { refreshTokenVersion: { increment: 1 } },
    });
    return user.refreshTokenVersion;
  }
}
