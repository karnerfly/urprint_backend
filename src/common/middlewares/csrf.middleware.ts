import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CONFIG_NAME } from '../config';
import type { AppConfig } from '../config';
import { getRandomHex } from '../utils/random';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  constructor(@Inject(CONFIG_NAME) private config: AppConfig) {}
  use(req: Request, res: Response, next: NextFunction) {
    if (!req.cookies['csrf_token']) {
      res.cookie('csrf_token', getRandomHex(32), {
        domain: this.config.GetWildCardDomain(),
        httpOnly: false,
        path: '/',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24,
      });
    }
    next();
  }
}
