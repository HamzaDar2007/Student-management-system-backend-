import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { FacultiesService } from './faculties.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Faculties')
@ApiBearerAuth('JWT-auth')
@Controller('faculties')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FacultiesController {
  constructor(private readonly facultiesService: FacultiesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new faculty (Admin only)' })
  @ApiResponse({ status: 201, description: 'Faculty created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 409, description: 'Faculty with this name already exists' })
  create(@Body() createFacultyDto: CreateFacultyDto) {
    return this.facultiesService.create(createFacultyDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all faculties' })
  @ApiResponse({ status: 200, description: 'Returns list of all faculties' })
  findAll() {
    return this.facultiesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get faculty by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Faculty ID' })
  @ApiResponse({ status: 200, description: 'Returns faculty data' })
  @ApiResponse({ status: 404, description: 'Faculty not found' })
  findOne(@Param('id') id: string) {
    return this.facultiesService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update faculty by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Faculty ID' })
  @ApiResponse({ status: 200, description: 'Faculty updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Faculty not found' })
  update(@Param('id') id: string, @Body() updateFacultyDto: UpdateFacultyDto) {
    return this.facultiesService.update(+id, updateFacultyDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete faculty by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Faculty ID' })
  @ApiResponse({ status: 200, description: 'Faculty deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Faculty not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete faculty with existing departments' })
  remove(@Param('id') id: string) {
    return this.facultiesService.remove(+id);
  }
}
