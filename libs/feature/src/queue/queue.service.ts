import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  constructor(private readonly moduleRef: ModuleRef) {}

  async dispatch<T>(queueName: string, jobName: string, payload: T): Promise<void> {
    const queue = this.moduleRef.get<Queue>(getQueueToken(queueName), { strict: false });
    await queue.add(jobName, payload);
  }
}
