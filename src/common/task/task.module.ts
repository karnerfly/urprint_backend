import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { BullModule } from '@nestjs/bullmq';
import { loadConfig } from '../config/env.config';
import { EmailConsumer } from './consumers/email.consumer';

/* Not a part of nest container lifecycle (don't know how to fix it, but still gets values from cache) */
const config = loadConfig('.env');

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
      connection: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        username: config.REDIS_USERNAME,
        password: config.REDIS_PASSWORD,
      },
      defaultJobOptions: {
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
    BullModule.registerQueue({
      name: 'sms',
      connection: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        username: config.REDIS_USERNAME,
        password: config.REDIS_PASSWORD,
      },
      defaultJobOptions: {
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
  ],
  providers: [TaskService, EmailConsumer],
  exports: [TaskService],
})
export class TaskModule {}
