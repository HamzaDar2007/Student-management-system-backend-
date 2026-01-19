import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentListQueryDto } from './dto/student-list-query.dto';

@ApiTags('Students')
@ApiBearerAuth('JWT-auth')
@Controller('api/students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new student (Admin only)' })
  @ApiResponse({ status: 201, description: 'Student created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all students with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of students' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Query() query: StudentListQueryDto) {
    return this.studentsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get student by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Returns student data' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update student by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete student by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.remove(id);
  }

  @Get(':id/grades')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all grades for a student' })
  @ApiParam({ name: 'id', type: 'number', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Returns student grades' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  grades(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.getGrades(id);
  }

  @Get(':id/attendance')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get attendance records for a student' })
  @ApiParam({ name: 'id', type: 'number', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Returns student attendance records' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  attendance(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.getAttendance(id);
  }
}
