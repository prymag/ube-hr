import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { AuthController } from './app/auth/auth.controller';
import { UsersController } from './app/users/users.controller';
import { TeamsController } from './app/teams/teams.controller';
import { PermissionsController } from './app/permissions/permissions.controller';
import { DepartmentsController } from './app/departments/departments.controller';
import { PositionsController } from './app/positions/positions.controller';
import { HolidaysController } from './app/holidays/holidays.controller';
import { LeavesController } from './app/leaves/leaves.controller';
import { LeaveBalanceController } from './app/leave-balance/leave-balance.controller';
import { LeaveAccrualsController } from './app/leave-accruals/leave-accruals.controller';
import { AppConfigModule, PrismaModule, StorageModule } from '@ube-hr/backend';
import {
  AuthModule,
  AuthMiddleware,
  UsersModule,
  TeamsModule,
  PermissionsModule,
  VerificationModule,
  QueueModule,
  DepartmentsModule,
  PositionsModule,
  HolidaysModule,
  LeavesModule,
  LeaveBalanceModule,
  LeaveAccrualModule,
} from '@ube-hr/feature';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    StorageModule,
    ScheduleModule.forRoot(),
    QueueModule,
    PermissionsModule,
    AuthModule,
    UsersModule,
    TeamsModule,
    VerificationModule,
    DepartmentsModule,
    PositionsModule,
    HolidaysModule,
    LeavesModule,
    LeaveBalanceModule,
    LeaveAccrualModule,
  ],
  controllers: [
    AppController,
    AuthController,
    UsersController,
    TeamsController,
    PermissionsController,
    DepartmentsController,
    PositionsController,
    HolidaysController,
    LeavesController,
    LeaveBalanceController,
    LeaveAccrualsController,
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
