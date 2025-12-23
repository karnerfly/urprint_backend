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

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.shouldValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
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

    return value;
  }

  private shouldValidate(metatype: Function): boolean {
    const primitives: Function[] = [String, Boolean, Number, Array, Object];
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
    return !isNaN(Number(value));
  }
}
