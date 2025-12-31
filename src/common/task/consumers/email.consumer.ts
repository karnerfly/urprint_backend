import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { type AppConfig, CONFIG_NAME } from 'src/common/config';
import { EMAIL_TASKS } from 'src/models/enums/task.enum';
import {
  EMAIL_VERIFICATION_PAYLOAD,
  TWO_FACTOR_AUTHENTICATION_PAYLOAD,
} from 'src/models/task';
import { Resend } from 'resend';

@Processor('email')
export class EmailConsumer extends WorkerHost {
  private logger: Logger;
  private client: Resend;

  constructor(@Inject(CONFIG_NAME) private readonly config: AppConfig) {
    super();
    this.logger = new Logger(EmailConsumer.name);
    this.client = new Resend(this.config.RESEND_API_KEY);
  }

  async process(job: Job): Promise<any> {
    this.logger.log('Background process started');

    switch (job.name) {
      case EMAIL_TASKS.SEND_EMAIL_VERIFICATION: {
        const data = job.data as EMAIL_VERIFICATION_PAYLOAD;
        try {
          await this.client.emails.send({
            from: this.config.FROM_MAIL,
            to: data.identity,
            subject: 'Email Verification',
            text: `Hey ${data.name}, Your Open Time Password: ${data.otp}`,
          });
        } catch (error) {
          this.logger.error('Failed to send email: ', error);
        }
        break;
      }
      case EMAIL_TASKS.SEND_TWO_FACTOR_AUTHENTICATION: {
        const data = job.data as TWO_FACTOR_AUTHENTICATION_PAYLOAD;
        try {
          await this.client.emails.send({
            from: this.config.FROM_MAIL,
            to: data.identity,
            subject: 'Two Factor Authentication',
            text: `Hey ${data.identity}, Your Open Time Password: ${data.otp}`,
          });
        } catch (error) {
          this.logger.error('Failed to send email: ', error);
        }
        break;
      }
    }

    this.logger.log('Background process stopped');
  }
}
