import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : parseInt(value as string, 10),
  )
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : parseInt(value as string, 10),
  )
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
