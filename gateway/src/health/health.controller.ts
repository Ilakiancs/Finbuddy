import { Controller, Get } from '@nestjs/common';
import { 
  HealthCheck, 
  HealthCheckService, 
  HttpHealthIndicator, 
  HealthIndicatorResult,
  MemoryHealthIndicator,
  DiskHealthIndicator 
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private configService: ConfigService,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Memory health check
      async () => this.memory.checkHeap('memory_heap', 250 * 1024 * 1024), // 250MB
      async () => this.memory.checkRSS('memory_rss', 512 * 1024 * 1024), // 512MB
      
      // Disk health check
      async () => this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }),
      
      // Blade health checks - check if services are up
      async () => this.checkBladeHealth('auth'),
      async () => this.checkBladeHealth('expense'),
      async () => this.checkBladeHealth('budget'),
      async () => this.checkBladeHealth('goals'),
      async () => this.checkBladeHealth('insights'),
      async () => this.checkBladeHealth('chat'),
      async () => this.checkBladeHealth('ai'),
      async () => this.checkBladeHealth('sync'),
      async () => this.checkBladeHealth('notification'),
      async () => this.checkBladeHealth('data'),
    ]);
  }

  private async checkBladeHealth(blade: string): Promise<HealthIndicatorResult> {
    const url = this.configService.get<string>(`${blade.toUpperCase()}_SERVICE_URL`);
    
    if (!url) {
      return {
        [blade]: {
          status: 'up',
          message: `${blade} service not configured - skipping check`,
        },
      };
    }

    try {
      // Attempt to reach the service's health endpoint
      return await this.http.pingCheck(blade, `${url}/health`);
    } catch (error) {
      // Handle errors gracefully - don't bring down the gateway if one service is down
      return {
        [blade]: {
          status: 'down',
          message: error.message,
        },
      };
    }
  }
}