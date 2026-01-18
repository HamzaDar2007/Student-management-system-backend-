import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Length } from 'class-validator';
import { AttendanceStatus } from '../entities/attendance.entity';

export class UpdateAttendanceDto {
  @IsOptional()
  @IsInt()
  student_id?: number;

  @IsOptional()
  @IsInt()
  course_id?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;
}
