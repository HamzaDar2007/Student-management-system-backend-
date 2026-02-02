import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateEnrollmentDto {
  @IsString()
  studentId: string;

  @IsString()
  courseId: string;

  @IsOptional()
  @IsDateString()
  enrollmentDate?: string;
}
