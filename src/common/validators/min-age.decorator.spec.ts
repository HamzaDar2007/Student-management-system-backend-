import { validate } from 'class-validator';
import { MinAge } from './min-age.decorator';

class TestDto16 {
  @MinAge(16)
  dateOfBirth: any;
}

class TestDto18 {
  @MinAge(18)
  dateOfBirth: any;
}

describe('MinAge', () => {
  describe('with minimum age of 16', () => {
    let dto: TestDto16;

    beforeEach(() => {
      dto = new TestDto16();
    });

    it('should reject non-string values', async () => {
      dto.dateOfBirth = new Date();
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid date strings', async () => {
      dto.dateOfBirth = 'not-a-date';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject dates that result in age below minimum', async () => {
      const today = new Date();
      const tooYoung = new Date(
        today.getFullYear() - 15,
        today.getMonth(),
        today.getDate(),
      );
      dto.dateOfBirth = tooYoung.toISOString().split('T')[0];
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept dates that result in age exactly at minimum', async () => {
      const today = new Date();
      const exactlyMinAge = new Date(
        today.getFullYear() - 16,
        today.getMonth(),
        today.getDate(),
      );
      dto.dateOfBirth = exactlyMinAge.toISOString().split('T')[0];
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept dates that result in age above minimum', async () => {
      const today = new Date();
      const olderThanMin = new Date(
        today.getFullYear() - 20,
        today.getMonth(),
        today.getDate(),
      );
      dto.dateOfBirth = olderThanMin.toISOString().split('T')[0];
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should return correct default error message', async () => {
      const today = new Date();
      const tooYoung = new Date(
        today.getFullYear() - 10,
        today.getMonth(),
        today.getDate(),
      );
      dto.dateOfBirth = tooYoung.toISOString().split('T')[0];
      const errors = await validate(dto);
      expect(errors[0].constraints?.minAge).toContain('at least 16');
    });
  });

  describe('with minimum age of 18', () => {
    let dto: TestDto18;

    beforeEach(() => {
      dto = new TestDto18();
    });

    it('should reject 17 year old', async () => {
      const today = new Date();
      const seventeenYearsOld = new Date(
        today.getFullYear() - 17,
        today.getMonth(),
        today.getDate(),
      );
      dto.dateOfBirth = seventeenYearsOld.toISOString().split('T')[0];
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept 18 year old', async () => {
      const today = new Date();
      const eighteenYearsOld = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate(),
      );
      dto.dateOfBirth = eighteenYearsOld.toISOString().split('T')[0];
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should return correct default error message with 18', async () => {
      const today = new Date();
      const tooYoung = new Date(
        today.getFullYear() - 10,
        today.getMonth(),
        today.getDate(),
      );
      dto.dateOfBirth = tooYoung.toISOString().split('T')[0];
      const errors = await validate(dto);
      expect(errors[0].constraints?.minAge).toContain('at least 18');
    });
  });

  describe('edge cases', () => {
    let dto: TestDto16;

    beforeEach(() => {
      dto = new TestDto16();
    });

    it('should handle ISO date format', async () => {
      dto.dateOfBirth = '2000-05-15';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle full ISO timestamp', async () => {
      dto.dateOfBirth = '2000-05-15T00:00:00.000Z';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
