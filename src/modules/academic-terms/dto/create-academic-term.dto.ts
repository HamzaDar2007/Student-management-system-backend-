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
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
