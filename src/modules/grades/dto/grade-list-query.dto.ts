import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class GradeListQueryDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  studentId?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  assessmentType?: string;
}
