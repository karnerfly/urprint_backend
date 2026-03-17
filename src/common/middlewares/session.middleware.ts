import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { type AppConfig, CONFIG_NAME } from '../config';
import NAMES from 'src/constants/name';
import { SessionService } from '../session/session.service';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(
    @Inject(CONFIG_NAME) private readonly config: AppConfig,
    private readonly session: SessionService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const sessionId = req.cookies[NAMES.COOKIE.AUTH_SESSION] as string;
    const sessionSecret = req.cookies[
      NAMES.COOKIE.AUTH_SESSION_SECRET
    ] as string;

    if (!sessionId || !sessionSecret) {
      return next();
    }

    const session = await this.session.get(
      sessionId,
      Buffer.from(sessionSecret, 'hex'),
    );

    if (!session) {
      res.cookie(NAMES.COOKIE.AUTH_SESSION_SECRET, '', {
        domain: this.config.GetWildCardDomain(),
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: -1,
      });

      res.cookie(NAMES.COOKIE.AUTH_SESSION, '', {
        domain: this.config.GetWildCardDomain(),
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: -1,
      });

      return next();
    }

    res.locals['session'] = session;

    next();
  }
}
