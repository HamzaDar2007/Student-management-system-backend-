import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PaginationDto } from './pagination.dto';

describe('PaginationDto', () => {
  const transformAndValidate = async (plain: Record<string, any>) => {
    const instance = plainToInstance(PaginationDto, plain);
    const errors = await validate(instance);
    return { instance, errors };
  };

  describe('page property', () => {
    it('should have default value of 1', async () => {
      const { instance, errors } = await transformAndValidate({});
      expect(errors.length).toBe(0);
      expect(instance.page).toBe(1);
    });

    it('should transform string to integer', async () => {
      const { instance, errors } = await transformAndValidate({ page: '5' });
      expect(errors.length).toBe(0);
      expect(instance.page).toBe(5);
    });

    it('should reject page less than 1', async () => {
      const { errors } = await transformAndValidate({ page: '0' });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('page');
    });

    it('should reject negative page', async () => {
      const { errors } = await transformAndValidate({ page: '-1' });
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept valid page number', async () => {
      const { instance, errors } = await transformAndValidate({ page: '10' });
      expect(errors.length).toBe(0);
      expect(instance.page).toBe(10);
    });
  });

  describe('limit property', () => {
    it('should have default value of 10', async () => {
      const { instance, errors } = await transformAndValidate({});
      expect(errors.length).toBe(0);
      expect(instance.limit).toBe(10);
    });

    it('should transform string to integer', async () => {
      const { instance, errors } = await transformAndValidate({ limit: '20' });
      expect(errors.length).toBe(0);
      expect(instance.limit).toBe(20);
    });

    it('should reject limit less than 1', async () => {
      const { errors } = await transformAndValidate({ limit: '0' });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('limit');
    });

    it('should reject limit greater than 100', async () => {
      const { errors } = await transformAndValidate({ limit: '101' });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('limit');
    });

    it('should accept limit at maximum (100)', async () => {
      const { instance, errors } = await transformAndValidate({ limit: '100' });
      expect(errors.length).toBe(0);
      expect(instance.limit).toBe(100);
    });

    it('should accept limit at minimum (1)', async () => {
      const { instance, errors } = await transformAndValidate({ limit: '1' });
      expect(errors.length).toBe(0);
      expect(instance.limit).toBe(1);
    });
  });

  describe('combined validation', () => {
    it('should accept valid page and limit', async () => {
      const { instance, errors } = await transformAndValidate({
        page: '3',
        limit: '25',
      });
      expect(errors.length).toBe(0);
      expect(instance.page).toBe(3);
      expect(instance.limit).toBe(25);
    });

    it('should handle undefined values by keeping them undefined (transform preserves undefined)', async () => {
      const { instance, errors } = await transformAndValidate({
        page: undefined,
        limit: undefined,
      });
      expect(errors.length).toBe(0);
      // The Transform decorator preserves undefined values
      expect(instance.page).toBeUndefined();
      expect(instance.limit).toBeUndefined();
    });
  });
});
