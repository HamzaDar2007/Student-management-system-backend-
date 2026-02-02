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
import { GradesService } from './grades.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradeListQueryDto } from './dto/grade-list-query.dto';

@ApiTags('Grades')
@ApiBearerAuth('JWT-auth')
@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Create a new grade (Admin/Teacher)' })
  @ApiResponse({ status: 201, description: 'Grade created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() dto: CreateGradeDto, @CurrentUser() user: User) {
    return this.gradesService.create(dto, user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all grades with pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of grades' })
  findAll(@Query() query: GradeListQueryDto) {
    return this.gradesService.findAll(query);
  }

  @Get('course/:courseId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all grades for a specific course' })
  @ApiParam({ name: 'courseId', type: 'number', description: 'Course ID' })
  @ApiQuery({
    name: 'assessment_type',
    required: false,
    description: 'Filter by assessment type',
  })
  @ApiResponse({ status: 200, description: 'Returns course grades' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  courseGrades(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query('assessment_type') assessmentType?: string,
  ) {
    return this.gradesService.getCourseGrades(courseId, assessmentType);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get grade by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Grade ID' })
  @ApiResponse({ status: 200, description: 'Returns grade data' })
  @ApiResponse({ status: 404, description: 'Grade not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gradesService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update grade by ID (Admin/Teacher)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Grade ID' })
  @ApiResponse({ status: 200, description: 'Grade updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Grade not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGradeDto,
    @CurrentUser() user: User,
  ) {
    return this.gradesService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Delete grade by ID (Admin/Teacher)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Grade ID' })
  @ApiResponse({ status: 200, description: 'Grade deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Grade not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.gradesService.remove(id);
  }
}
