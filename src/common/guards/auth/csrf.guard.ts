import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { type AppConfig, CONFIG_NAME } from 'src/common/config';
import type { Request } from 'express';
import NAMES from 'src/constants/name';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(@Inject(CONFIG_NAME) private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method.toLocaleLowerCase();

    if (['get', 'head', 'options'].includes(method)) {
      return true;
    }

    const csrfHeader = req.headers[NAMES.HEADER.CSRF_TOKEN];
    const csrfCookie = req.cookies[NAMES.COOKIE.CSRF_TOKEN] as string;

    if (!csrfHeader || !csrfCookie) {
      throw new ForbiddenException('Invalid csrf token');
    }

    if (csrfHeader !== csrfCookie) {
      throw new ForbiddenException('Invalid csrf token');
    }

    return true;
  }
}
