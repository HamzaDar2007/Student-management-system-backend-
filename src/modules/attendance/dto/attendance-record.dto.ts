import { IsEnum, IsInt, IsOptional, IsString, Length } from 'class-validator';
import { AttendanceStatus } from '../entities/attendance.entity';

export class AttendanceRecordDto {
  @IsInt()
  student_id: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;
}
