import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function Match<T extends object>(
  property: keyof T,
  validationOptions?: ValidationOptions,
) {
  return function (target: object, propertyName: string | symbol): void {
    registerDecorator({
      name: 'Match',
      target: target.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [relatedProperty] = args.constraints as [keyof T];
          const object = args.object as T;

          return value === object[relatedProperty];
        },
        defaultMessage(args: ValidationArguments): string {
          const [relatedProperty] = args.constraints as [keyof T];
          return `${String(propertyName)} must match ${String(
            relatedProperty,
          )}`;
        },
      },
    });
  };
}
