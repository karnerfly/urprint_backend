import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JWTPayload } from 'src/models/dto/auth.dto';

export const TokenData = createParamDecorator<any, JWTPayload>(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request['tokenData'] as JWTPayload;
  },
);
