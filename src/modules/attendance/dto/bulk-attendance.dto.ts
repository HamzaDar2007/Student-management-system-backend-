import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, ValidateNested } from 'class-validator';
import { AttendanceRecordDto } from './attendance-record.dto';

export class BulkAttendanceDto {
  @IsInt()
  course_id: number;

  @IsDateString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}
