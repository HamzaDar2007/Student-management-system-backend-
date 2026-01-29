import { IsDateString, IsInt, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class AttendanceReportQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value === undefined ? undefined : parseInt(value, 10),
  )
  @IsInt()
  student_id?: number;

  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value === undefined ? undefined : parseInt(value, 10),
  )
  @IsInt()
  course_id?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}
