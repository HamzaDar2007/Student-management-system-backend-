import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class CreateEnrollmentDto {
  @IsInt()
  student_id: string;

  @IsInt()
  course_id: number;

  @IsOptional()
  @IsDateString()
  enrollment_date?: string;
}
