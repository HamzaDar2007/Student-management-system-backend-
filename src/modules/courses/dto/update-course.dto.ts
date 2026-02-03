import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateCourseDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Length(2, 20)
  courseCode?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(2, 100)
  courseName?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  credits?: number;

  @IsOptional()
  @IsString()
  departmentId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  semester?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  maxStudents?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  createdBy?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  teacherIds?: number[];
}
