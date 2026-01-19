import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { CreateSchedulingDto } from './dto/create-scheduling.dto';
import { UpdateSchedulingDto } from './dto/update-scheduling.dto';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('scheduling')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  // Schedule endpoints
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createSchedulingDto: CreateSchedulingDto) {
    return this.schedulingService.create(createSchedulingDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.schedulingService.findAll(page || 1, limit || 10);
  }

  @Get('course/:courseId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  findByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.schedulingService.findByCourse(courseId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.schedulingService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateSchedulingDto: UpdateSchedulingDto) {
    return this.schedulingService.update(id, updateSchedulingDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.schedulingService.remove(id);
  }

  // Classroom endpoints
  @Post('classrooms')
  @Roles(UserRole.ADMIN)
  createClassroom(@Body() dto: CreateClassroomDto) {
    return this.schedulingService.createClassroom(dto);
  }

  @Get('classrooms')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  findAllClassrooms(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.schedulingService.findAllClassrooms(page || 1, limit || 10);
  }

  @Get('classrooms/:id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  findOneClassroom(@Param('id', ParseIntPipe) id: number) {
    return this.schedulingService.findOneClassroom(id);
  }

  @Get('classrooms/:id/schedules')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  findClassroomSchedules(@Param('id', ParseIntPipe) id: number) {
    return this.schedulingService.findByClassroom(id);
  }

  @Patch('classrooms/:id')
  @Roles(UserRole.ADMIN)
  updateClassroom(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClassroomDto) {
    return this.schedulingService.updateClassroom(id, dto);
  }

  @Delete('classrooms/:id')
  @Roles(UserRole.ADMIN)
  removeClassroom(@Param('id', ParseIntPipe) id: number) {
    return this.schedulingService.removeClassroom(id);
  }
}
