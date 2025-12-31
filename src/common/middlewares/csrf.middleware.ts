import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { type AppConfig, CONFIG_NAME } from '../config';
import { getRandomBase64Url } from '../utils/random';
import NAMES from 'src/constants/name';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  constructor(@Inject(CONFIG_NAME) private readonly config: AppConfig) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (!req.cookies[NAMES.COOKIE.CSRF_TOKEN]) {
      res.cookie(NAMES.COOKIE.CSRF_TOKEN, getRandomBase64Url(32), {
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
