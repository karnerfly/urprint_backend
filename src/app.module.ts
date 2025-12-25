import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { DatabaseExceptionFilter } from './common/filters/database_exception.filter';
import { ShopModule } from './modules/shop/shop.module';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { MasterdataModule } from './modules/masterdata/masterdata.module';
import { JwtModule } from '@nestjs/jwt';
import { CustomerModule } from './modules/customer/customer.module';
import { S3Module } from './common/s3/s3.module';
import { TaskModule } from './common/task/task.module';
import { AppConfigModule } from './common/config/config.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CsrfMiddleware } from './common/middlewares/csrf.middleware';
import { CronModule } from './modules/cron/cron.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),
    AppConfigModule,
    CronModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
    }),
    JwtModule,
    S3Module,
    TaskModule,
    MasterdataModule,
    ShopModule,
    CustomerModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: DatabaseExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CsrfMiddleware)
      .exclude({ path: '/auth/csrf', method: RequestMethod.GET })
      .forRoutes('*path');
  }
}
