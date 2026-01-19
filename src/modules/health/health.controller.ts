import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('Health')
@Controller('api/health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Full health check (database, memory, disk)' })
  @ApiResponse({ status: 200, description: 'All health checks passed' })
  @ApiResponse({ status: 503, description: 'One or more health checks failed' })
  check() {
    return this.health.check([
      // Database check
      () => this.db.pingCheck('database'),
      // Memory heap check (max 150MB)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      // Memory RSS check (max 300MB)
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
      // Disk storage check (max 90% used)
      () =>
        this.disk.checkStorage('storage', {
          path: process.platform === 'win32' ? 'C:\\' : '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  @Get('liveness')
  @ApiOperation({ summary: 'Liveness probe - check if application is running' })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('readiness')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe - check if application can handle requests' })
  @ApiResponse({ status: 200, description: 'Application is ready' })
  @ApiResponse({ status: 503, description: 'Application is not ready (database unavailable)' })
  readiness() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
