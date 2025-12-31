import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { type AppConfig, CONFIG_NAME } from '../config';
import { getRandomHex } from '../utils/random';
import NAMES from 'src/constants/name';

@Injectable()
export class DeviceIdMiddleware implements NestMiddleware {
  constructor(@Inject(CONFIG_NAME) private readonly config: AppConfig) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (!req.cookies[NAMES.COOKIE.DEVICE_ID]) {
      res.cookie(NAMES.COOKIE.DEVICE_ID, getRandomHex(16), {
        domain: this.config.GetWildCardDomain(),
        httpOnly: false,
        path: '/',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 365,
      });
    }
    next();
  }
}
