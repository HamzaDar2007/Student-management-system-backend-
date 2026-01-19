import { IsNotEmpty, IsOptional, IsString, MaxLength, IsInt, IsEnum, Min } from 'class-validator';
import { ClassroomType } from '../entities/classroom.entity';

export class CreateClassroomDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(20)
    room_number: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    building?: string;

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    capacity: number;

    @IsOptional()
    @IsEnum(ClassroomType)
    type?: ClassroomType;
}
