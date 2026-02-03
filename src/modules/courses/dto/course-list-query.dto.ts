import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CourseListQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value === undefined ? undefined : parseInt(value, 10),
  )
  @IsInt()
  @Min(1)
  @Max(8)
  semester?: number;

  @IsOptional()
  @Transform(({ value }: { value: string | boolean }) => {
    if (value === undefined) return undefined;
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : parseInt(value as string, 10),
  )
  @IsInt()
  teacherId?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  includeDeleted?: boolean;

  @IsOptional()
  search?: string;
}
