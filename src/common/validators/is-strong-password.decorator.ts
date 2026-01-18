import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/**
 * Rules:
 * - min 8 chars
 * - at least one uppercase
 * - at least one lowercase
 * - at least one number
 */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          if (value.length < 8) return false;
          if (!/[A-Z]/.test(value)) return false;
          if (!/[a-z]/.test(value)) return false;
          if (!/[0-9]/.test(value)) return false;
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be at least 8 characters and include uppercase, lowercase, and a number`;
        },
      },
    });
  };
}
