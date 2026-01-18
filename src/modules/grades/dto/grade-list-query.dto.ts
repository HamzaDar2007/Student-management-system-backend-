import { IsInt, IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class GradeListQueryDto extends PaginationDto {
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  @IsInt()
  student_id?: number;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  @IsInt()
  course_id?: number;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  assessment_type?: string;
}
