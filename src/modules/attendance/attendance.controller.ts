import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceListQueryDto } from './dto/attendance-list-query.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';

@ApiTags('Attendance')
@ApiBearerAuth('JWT-auth')
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Create attendance record (Admin/Teacher)' })
  @ApiResponse({
    status: 201,
    description: 'Attendance record created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateAttendanceDto, @CurrentUser() user: User) {
    return this.attendanceService.create(dto, user.id);
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary: 'Create multiple attendance records at once (Admin/Teacher)',
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk attendance records created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  bulkCreate(@Body() dto: BulkAttendanceDto, @CurrentUser() user: User) {
    return this.attendanceService.bulkCreate(dto, user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all attendance records with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of attendance records',
  })
  findAll(@Query() query: AttendanceListQueryDto) {
    return this.attendanceService.findAll(query);
  }

  @Get('report/:courseId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get attendance report for a course' })
  @ApiParam({ name: 'courseId', type: 'number', description: 'Course ID' })
  @ApiQuery({
    name: 'start_date',
    required: false,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    description: 'End date (YYYY-MM-DD)',
  })
  @ApiResponse({ status: 200, description: 'Returns attendance report' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  report(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.attendanceService.getReport(courseId, startDate, endDate);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get attendance record by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Attendance ID' })
  @ApiResponse({ status: 200, description: 'Returns attendance record' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.attendanceService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update attendance record by ID (Admin/Teacher)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Attendance ID' })
  @ApiResponse({
    status: 200,
    description: 'Attendance record updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAttendanceDto,
    @CurrentUser() user: User,
  ) {
    return this.attendanceService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Delete attendance record by ID (Admin/Teacher)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Attendance ID' })
  @ApiResponse({
    status: 200,
    description: 'Attendance record deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.attendanceService.remove(id);
  }
}
