import { Module } from '@nestjs/common';
import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { AppConfigModule, PrismaModule } from '@ube-hr/backend'

@Module({
  imports: [
    AppConfigModule,
    PrismaModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
