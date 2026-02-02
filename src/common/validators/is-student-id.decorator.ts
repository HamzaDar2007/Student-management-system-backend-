import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * Example required format:
 * STU2024001 or STU-2024-001 (STU + 4-digit year + 3+ digit sequence, with optional hyphens)
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
          // Accept both formats: STU2024001 or STU-2024-001
          return /^STU-?\d{4}-?\d{3,}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must match format STU + year + sequence (e.g., STU2024001 or STU-2024-001)`;
        },
      },
    });
  };
}
