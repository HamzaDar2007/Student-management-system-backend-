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

export class CreateStudentDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Length(7, 20)
  @IsStudentId()
  studentId: string;

  @IsOptional()
  @IsDateString()
  @MinAge(16, { message: 'student must be at least 16 years old' })
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  emergencyContact?: string;

  @IsDateString()
  enrollmentDate: string;

  @IsOptional()
  @IsInt()
  departmentId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  semester?: number;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  nationality?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  emergencyContactRelationship?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  guardianName?: string;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  guardianPhone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  guardianEmail?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  guardianRelationship?: string;

  @IsOptional()
  @IsString()
  medicalConditions?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  currentYear?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  currentSemester?: number;
}
