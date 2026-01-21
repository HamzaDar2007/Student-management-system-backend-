import {
  IsNotEmpty,
  IsInt,
  IsString,
  Min,
  Max,
  Matches,
} from 'class-validator';

export class CreateSchedulingDto {
  @IsNotEmpty()
  @IsInt()
  course_id: number;

  @IsNotEmpty()
  @IsInt()
  classroom_id: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week: number;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'start_time must be in HH:MM or HH:MM:SS format',
  })
  start_time: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'end_time must be in HH:MM or HH:MM:SS format',
  })
  end_time: string;
}
