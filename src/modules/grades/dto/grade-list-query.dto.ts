import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class GradeListQueryDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  student_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  course_id?: number;

  @IsOptional()
  @IsString()
  assessment_type?: string;
}
