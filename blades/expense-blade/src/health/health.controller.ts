import { Controller, Get } from '@nestjs/common';
import { 
  HealthCheck, 
  HealthCheckService, 
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator 
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/public.decorator';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { HttpHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private typeOrmHealthIndicator: TypeOrmHealthIndicator,
    private http: HttpHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private configService: ConfigService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Database connection check
      () => this.typeOrmHealthIndicator.pingCheck('database', { connection: this.connection }),
      
      // Memory health check
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024), // 200MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),   // 300MB
      
      // Disk health check
      () => this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }),
      
      // Data Blade connection check
      async () => {
        const dataBladeUrl = this.configService.get<string>('DATA_BLADE_URL');
        
        if (!dataBladeUrl) {
          return {
            dataBlade: {
              status: 'up',
              message: 'Data Blade URL not configured - skipping check',
            },
          };
        }
        
        return this.http.pingCheck('dataBlade', `${dataBladeUrl}/health`);
      },
    ]);
  }

  @Public()
  @Get('liveness')
  liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('readiness')
  @HealthCheck()
  readiness() {
    return this.health.check([
      // Only check database connection for readiness
      () => this.typeOrmHealthIndicator.pingCheck('database', { connection: this.connection }),
    ]);
  }
}