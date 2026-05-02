/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cookieParser());
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });
  app.enableCors({ origin: true, credentials: true });
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3000;

  const config = new DocumentBuilder()
    .setTitle('UBE HR API')
    .setDescription('The UBE HR API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customJsStr: `
      window.addEventListener('load', function () {
        const _fetch = window.fetch;
        window.fetch = async function (...args) {
          const response = await _fetch(...args);
          const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
          if (url && url.includes('/auth/login') && response.ok) {
            response.clone().json().then(function (data) {
              if (data && data.access_token && window.ui) {
                window.ui.preauthorizeApiKey('bearer', data.access_token);
              }
            }).catch(function () {});
          }
          return response;
        };
      });
    `,
  });

  app.enableShutdownHooks();
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
