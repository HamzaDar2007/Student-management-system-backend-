import { validate } from 'class-validator';
import { IsStrongPassword } from './is-strong-password.decorator';

class TestDto {
  @IsStrongPassword()
  password: any;
}

describe('IsStrongPassword', () => {
  let dto: TestDto;

  beforeEach(() => {
    dto = new TestDto();
  });

  it('should reject non-string values', async () => {
    dto.password = 12345678;
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject passwords shorter than 8 characters', async () => {
    dto.password = 'Abc123';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isStrongPassword');
  });

  it('should reject passwords without uppercase letter', async () => {
    dto.password = 'abcdefgh1';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject passwords without lowercase letter', async () => {
    dto.password = 'ABCDEFGH1';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject passwords without number', async () => {
    dto.password = 'Abcdefghi';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should accept valid password with all requirements', async () => {
    dto.password = 'Password1';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept password with special characters', async () => {
    dto.password = 'Password1!@#';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept longer valid passwords', async () => {
    dto.password = 'MySecurePassword123';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should return correct default error message', async () => {
    dto.password = 'weak';
    const errors = await validate(dto);
    expect(errors[0].constraints?.isStrongPassword).toContain(
      'must be at least 8 characters and include uppercase, lowercase, and a number',
    );
  });
});
