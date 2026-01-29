import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AuditQueryDto extends PaginationDto {
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value === undefined ? undefined : parseInt(value, 10),
  )
  @IsInt()
  user_id?: number;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  action?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  resource?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  resource_id?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}
