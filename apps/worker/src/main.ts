import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.init();
  Logger.log('Worker is running and listening for jobs');
}

bootstrap().catch((err) => {
  Logger.error('Worker failed to start', err);
  process.exit(1);
});
