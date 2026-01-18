import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class StudentListQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  department?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  @IsInt()
  @Min(1)
  @Max(8)
  semester?: number;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;
}
