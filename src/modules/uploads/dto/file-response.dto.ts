import { ApiProperty } from '@nestjs/swagger';

export class FileResponseDto {
  @ApiProperty({ description: 'Public URL of the uploaded file' })
  url: string;

  @ApiProperty({ description: 'Unique key/path of the file in storage' })
  key: string;

  @ApiProperty({ description: 'Original filename' })
  originalName: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({ description: 'MIME type of the file' })
  mimeType: string;
}

export class UploadResponseDto {
  @ApiProperty({ description: 'Upload status message' })
  message: string;

  @ApiProperty({ type: FileResponseDto, description: 'Uploaded file details' })
  file: FileResponseDto;
}

export class MultipleUploadResponseDto {
  @ApiProperty({ description: 'Upload status message' })
  message: string;

  @ApiProperty({
    type: [FileResponseDto],
    description: 'Array of uploaded file details',
  })
  files: FileResponseDto[];

  @ApiProperty({ description: 'Total number of files uploaded' })
  count: number;
}

export class DeleteFileResponseDto {
  @ApiProperty({ description: 'Delete status message' })
  message: string;

  @ApiProperty({ description: 'Whether the file was successfully deleted' })
  deleted: boolean;
}
