import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TaskService {
  private logger: Logger;

  constructor(private database: DatabaseService) {
    this.logger = new Logger(TaskService.name);
  }

  @Cron(CronExpression.EVERY_2_HOURS)
  async deleteStaleUploads() {
    try {
      this.logger.log('Start to delete expired or deleted uploads...');
      await this.database.upload.deleteMany({
        where: {
          OR: [
            { deleted: true },
            {
              expireAt: {
                lte: new Date(),
              },
            },
          ],
        },
      });
      this.logger.log('Stale uploads deleted successfully');
    } catch (error) {
      this.logger.error(error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteStaleRefreshToken() {
    try {
      this.logger.log('Start to delete expired refresh tokens...');
      await this.database.ownerToken.deleteMany({
        where: {
          OR: [
            {
              refreshTokenExpireAt: {
                lte: new Date(),
              },
            },
          ],
        },
      });
      this.logger.log('Expired refresh tokens deleted successfully');
    } catch (error) {
      this.logger.error(error);
    }
  }
}
