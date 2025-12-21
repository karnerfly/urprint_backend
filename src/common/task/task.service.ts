import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TaskService {
  private logger = new Logger(TaskService.name);

  constructor(private database: DatabaseService) {}

  @Cron('0 0-23/2 * * *')
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
}
