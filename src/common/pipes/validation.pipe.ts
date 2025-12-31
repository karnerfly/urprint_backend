import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

interface FieldError {
  field: string;
  errors: string[];
}

type ClassConstructor<T = unknown> = new (...args: unknown[]) => T;

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform<T extends object>(
    value: unknown,
    { metatype }: ArgumentMetadata,
  ): Promise<T> {
    if (!metatype || !this.shouldValidate(metatype)) {
      return value as T;
    }

    const object = plainToInstance(metatype as ClassConstructor<T>, value);

    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false },
    });

    if (errors.length > 0) {
      const fieldErrors = this.formatErrors(errors);

      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        fieldErrors,
      });
    }

    return object;
  }

  private shouldValidate(metatype: ClassConstructor): boolean {
    const primitives: readonly ClassConstructor[] = [
      String,
      Boolean,
      Number,
      Array,
      Object,
    ];

    return !primitives.includes(metatype);
  }

  private formatErrors(
    errors: ValidationError[],
    parentPath = '',
  ): FieldError[] {
    const result: FieldError[] = [];

    for (const error of errors) {
      const fieldPath = parentPath
        ? this.isNumeric(error.property)
          ? `${parentPath}[${error.property}]`
          : `${parentPath}.${error.property}`
        : error.property;

      if (error.constraints) {
        result.push({
          field: fieldPath,
          errors: Object.values(error.constraints),
        });
      }

      if (error.children?.length) {
        result.push(...this.formatErrors(error.children, fieldPath));
      }
    }

    return result;
  }

  private isNumeric(value: string): boolean {
    return !Number.isNaN(Number(value));
  }
}
