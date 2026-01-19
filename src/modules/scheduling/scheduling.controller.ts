import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service';
import { CreateSchedulingDto } from './dto/create-scheduling.dto';
import { UpdateSchedulingDto } from './dto/update-scheduling.dto';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Scheduling')
@ApiBearerAuth('JWT-auth')
@Controller('scheduling')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  // Schedule endpoints
  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new schedule (Admin only)' })
  @ApiResponse({ status: 201, description: 'Schedule created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 409, description: 'Schedule conflict detected' })
  create(@Body() createSchedulingDto: CreateSchedulingDto) {
    return this.schedulingService.create(createSchedulingDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all schedules with pagination' })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of schedules' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.schedulingService.findAll(page || 1, limit || 10);
  }

  @Get('course/:courseId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all schedules for a specific course' })
  @ApiParam({ name: 'courseId', type: 'number', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Returns course schedules' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  findByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.schedulingService.findByCourse(courseId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get schedule by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Schedule ID' })
  @ApiResponse({ status: 200, description: 'Returns schedule data' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.schedulingService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update schedule by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Schedule ID' })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  @ApiResponse({ status: 409, description: 'Schedule conflict detected' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateSchedulingDto: UpdateSchedulingDto) {
    return this.schedulingService.update(id, updateSchedulingDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete schedule by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Schedule ID' })
  @ApiResponse({ status: 200, description: 'Schedule deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.schedulingService.remove(id);
  }

  // Classroom endpoints
  @Post('classrooms')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new classroom (Admin only)' })
  @ApiResponse({ status: 201, description: 'Classroom created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 409, description: 'Classroom with this room number already exists' })
  createClassroom(@Body() dto: CreateClassroomDto) {
    return this.schedulingService.createClassroom(dto);
  }

  @Get('classrooms')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all classrooms with pagination' })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of classrooms' })
  findAllClassrooms(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.schedulingService.findAllClassrooms(page || 1, limit || 10);
  }

  @Get('classrooms/:id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get classroom by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Classroom ID' })
  @ApiResponse({ status: 200, description: 'Returns classroom data' })
  @ApiResponse({ status: 404, description: 'Classroom not found' })
  findOneClassroom(@Param('id', ParseIntPipe) id: number) {
    return this.schedulingService.findOneClassroom(id);
  }

  @Get('classrooms/:id/schedules')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all schedules for a specific classroom' })
  @ApiParam({ name: 'id', type: 'number', description: 'Classroom ID' })
  @ApiResponse({ status: 200, description: 'Returns classroom schedules' })
  @ApiResponse({ status: 404, description: 'Classroom not found' })
  findClassroomSchedules(@Param('id', ParseIntPipe) id: number) {
    return this.schedulingService.findByClassroom(id);
  }

  @Patch('classrooms/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update classroom by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Classroom ID' })
  @ApiResponse({ status: 200, description: 'Classroom updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Classroom not found' })
  updateClassroom(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClassroomDto) {
    return this.schedulingService.updateClassroom(id, dto);
  }

  @Delete('classrooms/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete classroom by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Classroom ID' })
  @ApiResponse({ status: 200, description: 'Classroom deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Classroom not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete classroom with existing schedules' })
  removeClassroom(@Param('id', ParseIntPipe) id: number) {
    return this.schedulingService.removeClassroom(id);
  }
}
