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
  ApiQuery,
} from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateTeacherProfileDto } from './dto/create-teacher-profile.dto';
import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto';

@ApiTags('Teachers')
@ApiBearerAuth('JWT-auth')
@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new teacher profile (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Teacher profile created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  create(@Body() dto: CreateTeacherProfileDto) {
    return this.teachersService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all teachers with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of teachers',
  })
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.teachersService.findAll(+page, +limit);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get teacher by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Teacher profile ID' })
  @ApiResponse({ status: 200, description: 'Returns teacher data' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.findOne(id);
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get teacher profile by user ID' })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns teacher profile for the user',
  })
  @ApiResponse({
    status: 404,
    description: 'Teacher profile not found for this user',
  })
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.teachersService.findByUserId(userId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update teacher profile by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Teacher profile ID' })
  @ApiResponse({
    status: 200,
    description: 'Teacher profile updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeacherProfileDto,
  ) {
    return this.teachersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete teacher profile by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Teacher profile ID' })
  @ApiResponse({
    status: 200,
    description: 'Teacher profile deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.remove(id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Restore a soft-deleted teacher profile (Admin only)',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'Teacher profile ID' })
  @ApiResponse({
    status: 200,
    description: 'Teacher profile restored successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.restore(id);
  }
}
