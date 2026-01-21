import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateGradeDto {
  @IsInt()
  student_id: number;

  @IsInt()
  course_id: number;

  @IsString()
  @Length(1, 50)
  assessment_type: string;

  @IsString()
  @Length(1, 100)
  assessment_name: string;

  @IsNumber()
  @Min(1)
  max_score: number;

  @IsNumber()
  @Min(0)
  score_obtained: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  weightage?: number;

  @IsOptional()
  @IsInt()
  graded_by?: number;
}
