import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/**
 * Example required format:
 * STU2024001 (STU + 4-digit year + 3+ digit sequence)
 */
export function IsStudentId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStudentId',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          return /^STU\d{4}\d{3,}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must match format STU + year + sequence (e.g., STU2024001)`;
        },
      },
    });
  };
}
