import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsStudentId } from '../../../common/validators/is-student-id.decorator';
import { MinAge } from '../../../common/validators/min-age.decorator';
import { Gender } from '../entities/student.entity';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  userId?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) =>
    value === undefined ? undefined : value.trim().toUpperCase(),
  )
  @IsString()
  @Length(7, 20)
  @IsStudentId()
  studentId?: string;

  @IsOptional()
  @IsDateString()
  @MinAge(16, { message: 'student must be at least 16 years old' })
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  emergencyContact?: string | null;

  @IsOptional()
  @IsDateString()
  enrollmentDate?: string;

  @IsOptional()
  @IsInt()
  departmentId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  semester?: number | null;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  bloodGroup?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  nationality?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  emergencyContactName?: string | null;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  emergencyContactPhone?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  emergencyContactRelationship?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  guardianName?: string | null;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  guardianPhone?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  guardianEmail?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  guardianRelationship?: string | null;

  @IsOptional()
  @IsString()
  medicalConditions?: string | null;

  @IsOptional()
  @IsString()
  allergies?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  currentYear?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  currentSemester?: number | null;
}
