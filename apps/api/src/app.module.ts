import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { AuthController } from './app/auth/auth.controller';
import { UsersController } from './app/users/users.controller';
import { TeamsController } from './app/teams/teams.controller';
import { PermissionsController } from './app/permissions/permissions.controller';
import { AppConfigModule, PrismaModule, StorageModule } from '@ube-hr/backend';
import {
  AuthModule,
  AuthMiddleware,
  UsersModule,
  TeamsModule,
  PermissionsModule,
  VerificationModule,
  QueueModule,
} from '@ube-hr/feature';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    StorageModule,
    QueueModule,
    PermissionsModule,
    AuthModule,
    UsersModule,
    TeamsModule,
    VerificationModule,
  ],
  controllers: [
    AppController,
    AuthController,
    UsersController,
    TeamsController,
    PermissionsController,
  ],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
