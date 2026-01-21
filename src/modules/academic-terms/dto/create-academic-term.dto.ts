import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsDateString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateAcademicTermDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  name: string;

  @IsNotEmpty()
  @IsDateString()
  start_date: string;

  @IsNotEmpty()
  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
