import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { JOB_QUEUES } from '@ube-hr/shared';
import { QueueService } from './queue.service';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: JOB_QUEUES.EMAIL }),
    BullModule.registerQueue({
      name: JOB_QUEUES.LEAVE,
      defaultJobOptions: { attempts: 1 },
    }),
  ],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
