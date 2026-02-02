import { IsObject, IsOptional, IsString, Length } from 'class-validator';

export class CreateAuditDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  @Length(1, 50)
  action: string; // CREATE, UPDATE, DELETE, LOGIN, LOGOUT

  @IsString()
  @Length(1, 100)
  resource: string; // Student, Grade, User, etc.

  @IsOptional()
  @IsString()
  @Length(1, 50)
  resourceId?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown> | null;
}
