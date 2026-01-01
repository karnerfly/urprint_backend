import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
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
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthThrottlerGuard } from './common/guards/auth/throttler.guard';
import { CsrfMiddleware } from './common/middlewares/csrf.middleware';
import { CronModule } from './modules/cron/cron.module';
import { OtpModule } from './modules/otp/otp.module';
import { AuthModule } from './modules/auth/auth.module';
import { DeviceIdMiddleware } from './common/middlewares/device_id.middleware';
import { CsrfGuard } from './common/guards/auth/csrf.guard';

@Module({
  imports: [
    AppConfigModule.forRoot('.env'),
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
    AuthModule,
    CustomerModule,
    CronModule,
    OtpModule,
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
      useClass: CsrfGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CsrfMiddleware)
      .exclude({ path: '/auth/csrf', method: RequestMethod.GET })
      .forRoutes('*csrf');

    consumer.apply(DeviceIdMiddleware).forRoutes('*deviceId');
  }
}
