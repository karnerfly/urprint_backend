import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { EMAIL_TASKS } from 'src/models/enums/task.enum';
import {
  EMAIL_VERIFICATION_PAYLOAD,
  TWO_FACTOR_AUTHENTICATION_PAYLOAD,
} from 'src/models/task';

@Injectable()
export class TaskService implements OnModuleInit {
  private logger: Logger;

  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('sms') private smsQueue: Queue, // not in use
  ) {
    this.logger = new Logger(TaskService.name);
  }

  onModuleInit() {
    this.init();
  }

  private init() {
    this.logger.log('All Queues are live.');

    this.emailQueue.on('progress', (jobId) => {
      this.logger.log(`Processing EMAIL job [id: ${jobId}]...`);
    });

    this.emailQueue.on('error', (error) => {
      this.logger.log(`Error in EMAIL job: ${error.message}`);
    });

    this.smsQueue.on('progress', (jobId) => {
      this.logger.log(`Processing SMS job [id: ${jobId}]...`);
    });

    this.smsQueue.on('error', (error) => {
      this.logger.log(`Error in SMS job: ${error.message}`);
    });
  }

  async SendEmailVerificationMail(payload: EMAIL_VERIFICATION_PAYLOAD) {
    const job = await this.emailQueue.add(
      EMAIL_TASKS.SEND_EMAIL_VERIFICATION,
      payload,
      { priority: 1 },
    );

    if (job.id) {
      this.logger.log(
        `Email Verification job created [id: ${job.id}, medium: EMAIL, identity: ${payload.identity}]`,
      );
    } else {
      this.logger.error(
        `Failed to create email Verification job [medium: EMAIL, identity: ${payload.identity}]`,
      );
    }
  }

  async SendTwoFactorAuthenticationMail(
    payload: TWO_FACTOR_AUTHENTICATION_PAYLOAD,
  ) {
    const job = await this.emailQueue.add(
      EMAIL_TASKS.SEND_TWO_FACTOR_AUTHENTICATION,
      payload,
      { priority: 2 },
    );

    if (job.id) {
      this.logger.log(
        `2FA job created [id: ${job.id}, medium: EMAIL, identity: ${payload.identity}]`,
      );
    } else {
      this.logger.error(
        `Failed to create 2FA job [medium: EMAIL, identity: ${payload.identity}]`,
      );
    }
  }
}
