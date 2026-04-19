import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@ube-hr/prisma-client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    const adapter = new PrismaMariaDb({
      host: config.getOrThrow<string>('MYSQL_HOST'),
      port: config.getOrThrow<number>('MYSQL_PORT'),
      user: config.getOrThrow<string>('MYSQL_USER'),
      password: config.getOrThrow<string>('MYSQL_PASSWORD'),
      database: config.getOrThrow<string>('MYSQL_DATABASE'),
      connectionLimit: 5,
    });
    super({ adapter });
  }

  async onModuleInit() {
    const maxRetries = 10;
    const delayMs = 3000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        await this.$queryRaw`SELECT 1`;
        return;
      } catch (err) {
        if (attempt === maxRetries) throw err;
        this.logger.warn(
          `Database not ready, retrying in ${delayMs / 1000}s... (${attempt}/${maxRetries})`,
        );
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
}
