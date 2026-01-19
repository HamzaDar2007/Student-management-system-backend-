import { IsBoolean, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CourseListQueryDto extends PaginationDto {
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  @IsInt()
  department_id?: number;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  @IsInt()
  @Min(1)
  @Max(8)
  semester?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  @IsInt()
  teacher_id?: number;
}
