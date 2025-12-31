import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { type AppConfig, CONFIG_NAME } from '../config';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  constructor(@Inject(CONFIG_NAME) private readonly config: AppConfig) {
    const adapter = new PrismaPg({
      connectionString: config.DATABASE_URL,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
