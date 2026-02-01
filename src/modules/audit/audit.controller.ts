import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Audit')
@ApiBearerAuth('JWT-auth')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get all audit logs with pagination (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of audit logs',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  findAll(@Query() query: AuditQueryDto) {
    return this.auditService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit log by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'Audit log ID' })
  @ApiResponse({ status: 200, description: 'Returns audit log data' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.auditService.findOne(id);
  }

  @Get('resource/:resource/:resourceId')
  @ApiOperation({
    summary: 'Get audit logs for a specific resource (Admin only)',
  })
  @ApiParam({
    name: 'resource',
    type: 'string',
    description: 'Resource type (e.g., user, student, course)',
  })
  @ApiParam({
    name: 'resourceId',
    type: 'string',
    description: 'ID of the resource',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns audit logs for the resource',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  findByResource(
    @Param('resource') resource: string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.auditService.findByResource(resource, resourceId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get audit logs for a specific user (Admin only)' })
  @ApiParam({ name: 'userId', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns audit logs for the user' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.auditService.findByUser(userId);
  }
}
