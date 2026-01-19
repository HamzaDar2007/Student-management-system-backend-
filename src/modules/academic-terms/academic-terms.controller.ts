import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AcademicTermsService } from './academic-terms.service';
import { CreateAcademicTermDto } from './dto/create-academic-term.dto';
import { UpdateAcademicTermDto } from './dto/update-academic-term.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Academic Terms')
@ApiBearerAuth('JWT-auth')
@Controller('academic-terms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicTermsController {
  constructor(private readonly academicTermsService: AcademicTermsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new academic term (Admin only)' })
  @ApiResponse({ status: 201, description: 'Academic term created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or date conflict' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  create(@Body() createAcademicTermDto: CreateAcademicTermDto) {
    return this.academicTermsService.create(createAcademicTermDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all academic terms' })
  @ApiResponse({ status: 200, description: 'Returns list of all academic terms' })
  findAll() {
    return this.academicTermsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get academic term by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Academic term ID' })
  @ApiResponse({ status: 200, description: 'Returns academic term data' })
  @ApiResponse({ status: 404, description: 'Academic term not found' })
  findOne(@Param('id') id: string) {
    return this.academicTermsService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update academic term by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Academic term ID' })
  @ApiResponse({ status: 200, description: 'Academic term updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Academic term not found' })
  update(@Param('id') id: string, @Body() updateAcademicTermDto: UpdateAcademicTermDto) {
    return this.academicTermsService.update(+id, updateAcademicTermDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete academic term by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Academic term ID' })
  @ApiResponse({ status: 200, description: 'Academic term deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Academic term not found' })
  remove(@Param('id') id: string) {
    return this.academicTermsService.remove(+id);
  }
}
