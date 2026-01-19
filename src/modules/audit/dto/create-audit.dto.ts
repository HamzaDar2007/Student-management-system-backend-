import { IsInt, IsObject, IsOptional, IsString, Length } from 'class-validator';

export class CreateAuditDto {
  @IsOptional()
  @IsInt()
  user_id?: number;

  @IsString()
  @Length(1, 50)
  action: string; // CREATE, UPDATE, DELETE, LOGIN, LOGOUT

  @IsString()
  @Length(1, 100)
  resource: string; // Student, Grade, User, etc.

  @IsOptional()
  @IsString()
  @Length(1, 50)
  resource_id?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}
