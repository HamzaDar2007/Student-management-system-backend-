import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { EnrollmentStatus } from '../entities/enrollment.entity';

export class EnrollmentListQueryDto extends PaginationDto {
  @IsOptional()
  @Transform(({ value }: { value: string }) =>
    value === undefined ? undefined : parseInt(value, 10),
  )
  @IsInt()
  studentId?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}
