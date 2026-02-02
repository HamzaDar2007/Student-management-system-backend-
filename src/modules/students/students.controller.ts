import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
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
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new student (Admin only)' })
  @ApiResponse({ status: 201, description: 'Student created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all students with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of students',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Query() query: StudentListQueryDto) {
    return this.studentsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get student by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Returns student data' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update student by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Student not found' })
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete student by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Student not found' })
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }

  @Get('deleted/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all soft-deleted students (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns list of deleted students' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  findDeleted() {
    return this.studentsService.findDeleted();
  }

  @Patch(':id/restore')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Restore a soft-deleted student (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Student restored successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiResponse({ status: 409, description: 'Student is not deleted' })
  restore(@Param('id') id: string) {
    return this.studentsService.restore(id);
  }

  @Get(':id/grades')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all grades for a student' })
  @ApiParam({ name: 'id', type: 'string', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Returns student grades' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  grades(@Param('id') id: string) {
    return this.studentsService.getGrades(id);
  }

  @Get(':id/attendance')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get attendance records for a student' })
  @ApiParam({ name: 'id', type: 'string', description: 'Student ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns student attendance records',
  })
  @ApiResponse({ status: 404, description: 'Student not found' })
  attendance(@Param('id') id: string) {
    return this.studentsService.getAttendance(id);
  }

  @Get('export/csv')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Export students to CSV' })
  @ApiResponse({ status: 200, description: 'Returns CSV file' })
  async exportToCSV(@Query() query: StudentListQueryDto, @Res() res: Response) {
    const csv = await this.studentsService.exportToCSV(query);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="students-${Date.now()}.csv"`,
    });
    res.send(csv);
  }

  @Post('import/csv')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import students from CSV (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns import results' })
  @ApiResponse({ status: 400, description: 'Invalid file or data' })
  async importFromCSV(@UploadedFile() file: Express.Multer.File) {
    return this.studentsService.importFromCSV(file);
  }

  @Post('bulk-delete')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk delete students (Admin only)' })
  @ApiResponse({ status: 200, description: 'Students deleted successfully' })
  async bulkDelete(@Body('studentIds') studentIds: string[]) {
    return this.studentsService.bulkDelete(studentIds);
  }

  @Post('bulk-activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk activate students (Admin only)' })
  @ApiResponse({ status: 200, description: 'Students activated successfully' })
  async bulkActivate(@Body('studentIds') studentIds: string[]) {
    return this.studentsService.bulkActivate(studentIds);
  }

  @Post('bulk-deactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk deactivate students (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Students deactivated successfully',
  })
  async bulkDeactivate(@Body('studentIds') studentIds: string[]) {
    return this.studentsService.bulkDeactivate(studentIds);
  }
}
