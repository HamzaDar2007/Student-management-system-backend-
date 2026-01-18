import { IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class UpdateEnrollmentGradeDto {
  @IsOptional()
  @IsString()
  @Length(1, 2)
  grade?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(4)
  grade_points?: number;
}
