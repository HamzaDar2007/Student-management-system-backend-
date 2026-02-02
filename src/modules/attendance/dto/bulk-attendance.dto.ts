import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AttendanceRecordDto } from './attendance-record.dto';

export class BulkAttendanceDto {
  @IsString()
  courseId: string;

  @IsDateString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}
