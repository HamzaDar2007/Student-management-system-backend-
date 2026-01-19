import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

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
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('readiness')
  @HealthCheck()
  readiness() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
