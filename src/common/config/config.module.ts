import { DynamicModule, Global, Module } from '@nestjs/common';
import { loadConfig } from './env.config';
import { CONFIG_NAME } from '.';

@Global()
@Module({})
export class AppConfigModule {
  static forRoot(paths: string | string[]): DynamicModule {
    return {
      module: AppConfigModule,
      providers: [
        {
          provide: CONFIG_NAME,
          useFactory: () => loadConfig(paths),
        },
      ],
      exports: [CONFIG_NAME],
    };
  }
}
