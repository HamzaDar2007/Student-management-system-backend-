import { validate } from 'class-validator';
import { IsStudentId } from './is-student-id.decorator';

class TestDto {
  @IsStudentId()
  studentId: any;
}

describe('IsStudentId', () => {
  let dto: TestDto;

  beforeEach(() => {
    dto = new TestDto();
  });

  it('should reject non-string values', async () => {
    dto.studentId = 2024001;
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject IDs not starting with STU', async () => {
    dto.studentId = 'ABC2024001';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject IDs with less than 4 digits for year', async () => {
    dto.studentId = 'STU24001';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject IDs with less than 3 digits for sequence', async () => {
    dto.studentId = 'STU202401';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should accept valid ID: STU2024001', async () => {
    dto.studentId = 'STU2024001';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid ID: STU2023999', async () => {
    dto.studentId = 'STU2023999';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept IDs with sequence longer than 3 digits', async () => {
    dto.studentId = 'STU20241234';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject lowercase stu2024001', async () => {
    dto.studentId = 'stu2024001';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject IDs with letters in year/sequence', async () => {
    dto.studentId = 'STU202A001';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should return correct default error message', async () => {
    dto.studentId = 'invalid';
    const errors = await validate(dto);
    expect(errors[0].constraints?.isStudentId).toContain(
      'must match format STU + year + sequence',
    );
  });
});
