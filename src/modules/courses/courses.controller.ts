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
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseListQueryDto } from './dto/course-list-query.dto';

@ApiTags('Courses')
@ApiBearerAuth('JWT-auth')
@Controller('api/courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new course (Admin only)' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all courses with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of courses' })
  findAll(@Query() query: CourseListQueryDto) {
    return this.coursesService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Returns course data' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update course by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete course by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.remove(id);
  }

  @Get(':id/students')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all students enrolled in a course' })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Returns list of enrolled students' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  students(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.getStudents(id);
  }

  @Get(':id/attendance')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get attendance records for a course' })
  @ApiParam({ name: 'id', type: 'number', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Returns course attendance records' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  attendance(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.getAttendance(id);
  }
}
