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
  user_id?: string;

  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Length(7, 20)
  @IsStudentId()
  student_id: string;

  @IsOptional()
  @IsDateString()
  @MinAge(16, { message: 'student must be at least 16 years old' })
  date_of_birth?: string;

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
  emergency_contact?: string;

  @IsDateString()
  enrollment_date: string;

  @IsOptional()
  @IsInt()
  department_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  semester?: number;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  blood_group?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  nationality?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  emergency_contact_name?: string;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  emergency_contact_phone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  emergency_contact_relationship?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  guardian_name?: string;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  guardian_phone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  guardian_email?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  guardian_relationship?: string;

  @IsOptional()
  @IsString()
  medical_conditions?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  current_year?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  current_semester?: number;
}
