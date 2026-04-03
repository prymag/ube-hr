import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../../../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class PrismaService extends PrismaClient {
  
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

}
