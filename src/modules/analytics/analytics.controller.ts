import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('admin/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Returns admin stats' })
  getAdminStats() {
    return this.analyticsService.getAdminStats();
  }

  @Get('admin/charts')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get admin dashboard chart data' })
  @ApiResponse({ status: 200, description: 'Returns admin chart data' })
  getAdminCharts() {
    return this.analyticsService.getAdminCharts();
  }

  @Get('teacher/stats')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Get teacher dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Returns teacher stats' })
  getTeacherStats(@CurrentUser() user: User) {
    return this.analyticsService.getTeacherStats(user.id);
  }

  @Get('teacher/charts')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Get teacher dashboard chart data' })
  @ApiResponse({ status: 200, description: 'Returns teacher chart data' })
  getTeacherCharts(@CurrentUser() user: User) {
    return this.analyticsService.getTeacherCharts(user.id);
  }

  @Get('student/stats')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get student dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Returns student stats' })
  getStudentStats(@CurrentUser() user: User) {
    return this.analyticsService.getStudentStats(user.id);
  }

  @Get('student/charts')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get student dashboard chart data' })
  @ApiResponse({ status: 200, description: 'Returns student chart data' })
  getStudentCharts(@CurrentUser() user: User) {
    return this.analyticsService.getStudentCharts(user.id);
  }
}
