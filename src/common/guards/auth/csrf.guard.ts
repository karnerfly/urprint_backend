import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  RequestMethod,
} from '@nestjs/common';
import { type AppConfig, CONFIG_NAME } from 'src/common/config';
import type { Request } from 'express';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(@Inject(CONFIG_NAME) private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    if (
      req.method == RequestMethod.GET.toString() ||
      req.method == RequestMethod.HEAD.toString() ||
      req.method == RequestMethod.OPTIONS.toString()
    ) {
      return true;
    }

    const csrfHeader = req.headers[this.config.CSRF_HEADER_NAME];
    const csrfCookie = req.cookies['csrf_token'] as string;

    if (!csrfHeader || !csrfCookie) {
      throw new ForbiddenException('Invalid csrf token');
    }

    if (csrfHeader !== csrfCookie) {
      throw new ForbiddenException('Invalid csrf token');
    }

    return true;
  }
}
