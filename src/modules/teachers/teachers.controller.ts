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
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateTeacherProfileDto } from './dto/create-teacher-profile.dto';
import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto';

@Controller('api/teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateTeacherProfileDto) {
    return this.teachersService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.teachersService.findAll(+page, +limit);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.findOne(id);
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.teachersService.findByUserId(userId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeacherProfileDto,
  ) {
    return this.teachersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.remove(id);
  }
}
