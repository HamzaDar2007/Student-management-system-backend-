import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
} from 'class-validator';

export class CreateDepartmentDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  code: string;

  @IsOptional()
  @IsInt()
  facultyId?: number;
}
