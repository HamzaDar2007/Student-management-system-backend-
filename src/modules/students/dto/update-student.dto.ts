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
  user_id?: string | null;

  @IsOptional()
  @Transform(({ value }: { value: string | undefined }) =>
    value === undefined ? undefined : value.trim().toUpperCase(),
  )
  @IsString()
  @Length(7, 20)
  @IsStudentId()
  student_id?: string;

  @IsOptional()
  @IsDateString()
  @MinAge(16, { message: 'student must be at least 16 years old' })
  date_of_birth?: string;

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
  emergency_contact?: string | null;

  @IsOptional()
  @IsDateString()
  enrollment_date?: string;

  @IsOptional()
  @IsInt()
  department_id?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  semester?: number | null;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  blood_group?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  nationality?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  emergency_contact_name?: string | null;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  emergency_contact_phone?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  emergency_contact_relationship?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  guardian_name?: string | null;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  guardian_phone?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  guardian_email?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  guardian_relationship?: string | null;

  @IsOptional()
  @IsString()
  medical_conditions?: string | null;

  @IsOptional()
  @IsString()
  allergies?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  current_year?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  current_semester?: number | null;
}
