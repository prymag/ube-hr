import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@ube-hr/backend';

@Injectable()
export class AppService {

  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async getData(): Promise<any> {
    const config = {
      host: this.config.getOrThrow<string>('MYSQL_HOST'),
      port: this.config.getOrThrow<number>('MYSQL_PORT'),
      user: this.config.getOrThrow<string>('MYSQL_USER'),
      password: this.config.getOrThrow<string>('MYSQL_PASSWORD'),
      database: this.config.getOrThrow<string>('MYSQL_DATABASE'),
    }
    const users = await this.prisma.user.findMany();
    return { message: 'Hello API', users, config };
  }
}
