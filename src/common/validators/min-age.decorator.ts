import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function MinAge(
  minYears: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'minAge',
      target: object.constructor,
      propertyName,
      constraints: [minYears],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) return false;

          const [min] = args.constraints as number[];
          const today = new Date();
          const cutoff = new Date(
            today.getFullYear() - min,
            today.getMonth(),
            today.getDate(),
          );
          return date <= cutoff;
        },
        defaultMessage(args: ValidationArguments) {
          const [min] = args.constraints as number[];
          return `${args.property} requires age to be at least ${min}`;
        },
      },
    });
  };
}
