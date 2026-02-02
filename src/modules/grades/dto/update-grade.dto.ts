import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class UpdateGradeDto {
  @IsOptional()
  @IsInt()
  studentId?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  assessmentType?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  assessmentName?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  scoreObtained?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  weightage?: number;

  @IsOptional()
  @IsString()
  gradedBy?: string | null;
}
