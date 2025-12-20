import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from 'src/common/database/generated/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  constructor(private httpAdapterHost: HttpAdapterHost) {}
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    let response: HttpException;

    switch (exception.code) {
      case 'P2000':
        response = new BadRequestException('Provided value is too long');
        break;
      case 'P2002':
        response = new ConflictException('Duplicate value provided');
        break;
      case 'P2025':
        response = new NotFoundException('Resource not found');
        break;
      default:
        response = new InternalServerErrorException(exception.message);
    }

    httpAdapter.reply(
      host.switchToHttp().getResponse(),
      response,
      response.getStatus(),
    );
  }
}
