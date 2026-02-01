import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { EnrollmentListQueryDto } from './dto/enrollment-list-query.dto';

@ApiTags('Enrollments')
@ApiBearerAuth('JWT-auth')
@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new enrollment (Admin only)' })
  @ApiResponse({ status: 201, description: 'Enrollment created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 409,
    description: 'Student already enrolled in this course',
  })
  create(@Body() dto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all enrollments with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of enrollments',
  })
  findAll(@Query() query: EnrollmentListQueryDto) {
    return this.enrollmentsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get enrollment by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Enrollment ID' })
  @ApiResponse({ status: 200, description: 'Returns enrollment data' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.enrollmentsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update enrollment by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Enrollment ID' })
  @ApiResponse({ status: 200, description: 'Enrollment updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete enrollment by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Enrollment ID' })
  @ApiResponse({ status: 200, description: 'Enrollment deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.enrollmentsService.remove(id);
  }

  @Patch(':id/grade')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update enrollment grade (Admin/Teacher)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Enrollment ID' })
  @ApiBody({
    schema: { properties: { grade: { type: 'string', example: 'A' } } },
  })
  @ApiResponse({ status: 200, description: 'Grade updated successfully' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  updateGrade(
    @Param('id', ParseIntPipe) id: number,
    @Body('grade') grade: string,
    @CurrentUser() user: User,
  ) {
    return this.enrollmentsService.updateGrade(id, grade, user.id);
  }
}
