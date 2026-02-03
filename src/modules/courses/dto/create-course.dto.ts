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

export class CreateCourseDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Length(2, 20)
  courseCode: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(2, 100)
  courseName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(6)
  credits: number;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  semester?: number;

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
  createdBy?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  teacherIds?: number[];
}
