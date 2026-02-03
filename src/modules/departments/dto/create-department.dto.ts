import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

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
  @IsString()
  facultyId?: string;
}
