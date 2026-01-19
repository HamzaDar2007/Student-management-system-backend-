import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { AcademicRank } from '../entities/teacher-profile.entity';

export class UpdateTeacherProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 20)
  employee_id?: string;

  @IsOptional()
  @IsEnum(AcademicRank)
  rank?: AcademicRank;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  specialization?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  office_location?: string;

  @IsOptional()
  @IsString()
  office_hours?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  phone?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsDateString()
  hire_date?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
