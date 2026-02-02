import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { AcademicRank } from '../entities/teacher-profile.entity';

export class UpdateTeacherProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 20)
  employeeId?: string;

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
  officeLocation?: string;

  @IsOptional()
  @IsString()
  officeHours?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  phone?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
