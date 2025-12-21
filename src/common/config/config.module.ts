import { Global, Module } from '@nestjs/common';
import { loadConfig } from './env.config';
import { CONFIG_NAME } from '.';

@Global()
@Module({
  providers: [
    {
      provide: CONFIG_NAME,
      useFactory: () => loadConfig(),
    },
  ],
  exports: [CONFIG_NAME],
})
export class AppConfigModule {}
