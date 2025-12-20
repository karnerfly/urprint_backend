import { Module } from '@nestjs/common';
import { Snowflake } from './snowflake.util';

@Module({
  providers: [
    {
      provide: Snowflake,
      useFactory: () => new Snowflake(10),
    },
  ],
  exports: [Snowflake],
})
export class SnowflakeModule {}
