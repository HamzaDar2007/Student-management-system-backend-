import { IsEnum } from 'class-validator';
import { EnrollmentStatus } from '../entities/enrollment.entity';

export class UpdateEnrollmentStatusDto {
  @IsEnum(EnrollmentStatus)
  status: EnrollmentStatus;
}
