import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/common/database/database.service';

@Injectable()
export class CronService {
  private logger: Logger;

  constructor(private readonly database: DatabaseService) {
    this.logger = new Logger(CronService.name);
  }

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
