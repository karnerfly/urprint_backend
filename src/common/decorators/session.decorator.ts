import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Response } from 'express';
import { Session } from 'src/models/dto/auth.dto';

export const SessionData = createParamDecorator<any, Session>(
  (_data: unknown, ctx: ExecutionContext) => {
    const response = ctx.switchToHttp().getResponse<Response>();
    return response.locals['session'] as Session;
  },
);
