import {
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateGradeDto {
  @IsString()
  studentId: string;

  @IsString()
  courseId: string;

  @IsString()
  @Length(1, 50)
  assessmentType: string;

  @IsString()
  @Length(1, 100)
  assessmentName: string;

  @IsNumber()
  @Min(1)
  maxScore: number;

  @IsNumber()
  @Min(0)
  scoreObtained: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  weightage?: number;

  @IsOptional()
  @IsString()
  gradedBy?: string;
}
