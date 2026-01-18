import { IsInt, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class UpdateGradeDto {
  @IsOptional()
  @IsInt()
  student_id?: number;

  @IsOptional()
  @IsInt()
  course_id?: number;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  assessment_type?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  assessment_name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_score?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  score_obtained?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  weightage?: number;

  @IsOptional()
  @IsInt()
  graded_by?: number | null;
}
