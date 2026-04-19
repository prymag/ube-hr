import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';

/**
 * Bootstrap a real NestJS application for integration tests.
 * Applies the same middleware and pipes used in main.ts.
 */
export async function createTestApp(): Promise<INestApplication> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = module.createNestApplication();
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  await app.init();
  return app;
}
