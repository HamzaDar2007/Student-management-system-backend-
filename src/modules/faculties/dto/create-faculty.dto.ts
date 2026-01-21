import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
} from 'class-validator';

export class CreateFacultyDto {
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
  dean_id?: number;
}
