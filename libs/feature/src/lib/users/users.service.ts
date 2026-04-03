import { Injectable } from '@nestjs/common';
import { secrets } from '@ube-hr/shared';
import { PrismaService } from '../prisma.service';

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
}
