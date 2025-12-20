import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { DatabaseExceptionFilter } from './common/filters/database_exception.filter';
import { ShopModule } from './modules/shop/shop.module';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { MasterdataModule } from './modules/masterdata/masterdata.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [ConfigModule.forRoot(), JwtModule, ShopModule, MasterdataModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: DatabaseExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
