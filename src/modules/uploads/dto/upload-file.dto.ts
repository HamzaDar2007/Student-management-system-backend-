import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiPropertyOptional({
    description: 'Folder to store the file in',
    example: 'documents',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  folder?: string;

  @ApiPropertyOptional({
    description: 'Description of the file',
    example: 'Student transcript document',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
