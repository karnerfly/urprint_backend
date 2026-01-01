import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import {
  ThrottlerException,
  ThrottlerGuard,
  ThrottlerRequest,
} from '@nestjs/throttler';
import type { Request } from 'express';
import NAMES from 'src/constants/name';
import { type JWTPayload } from 'src/models/dto/auth.dto';

class TooManyRequestException extends HttpException {
  constructor(objectOrError?: any, descriptionOrOptions = 'Too Many Request') {
    const { description, httpExceptionOptions } =
      HttpException.extractDescriptionAndOptionsFrom(descriptionOrOptions);
    super(
      HttpException.createBody(
        objectOrError,
        description ?? '',
        HttpStatus.TOO_MANY_REQUESTS,
      ),
      HttpStatus.TOO_MANY_REQUESTS,
      httpExceptionOptions,
    );
  }
}

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected generateKey(
    context: ExecutionContext,
    suffix: string,
    name: string,
  ): string {
    const req = context.switchToHttp().getRequest<Request>();
    let id = `${suffix}:${name}`;
    const token = req['tokenData'] as JWTPayload | undefined;
    const deviceId = req.cookies[NAMES.COOKIE.DEVICE_ID] as string | undefined;

    if (token) {
      id += `:${token.ownerId}`;
    } else if (deviceId) {
      id += `:${deviceId}`;
    }

    return id;
  }

  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    try {
      return await super.handleRequest(requestProps);
    } catch (error) {
      if (error instanceof ThrottlerException) {
        throw new TooManyRequestException(
          'Too many request, please try again later',
        );
      }
      throw error;
    }
  }
}
