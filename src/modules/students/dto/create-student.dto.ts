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
  @IsInt()
  user_id?: number;

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
}
