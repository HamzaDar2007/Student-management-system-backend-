import { IsDateString, IsOptional, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AuditQueryDto extends PaginationDto {
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value === undefined ? undefined : value,
  )
  @IsString()
  userId?: string;

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
  resourceId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
