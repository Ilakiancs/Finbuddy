import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import * as rateLimit from 'express-rate-limit';

@Injectable()
export class RateLimiterGuard implements CanActivate {
  private readonly limiters: Record<string, any> = {};

  constructor(private readonly configService: ConfigService) {
    // Create different rate limiters for different endpoints
    this.limiters = {
      default: this.createRateLimiter(
        60 * 15, // 15 minutes
        100      // 100 requests
      ),
      auth: this.createRateLimiter(
        60 * 15, // 15 minutes
        20       // 20 requests - restrict login attempts
      ),
      ai: this.createRateLimiter(
        60 * 1,  // 1 minute
        10       // 10 requests - AI services are more resource-intensive
      )
    };
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const path = request.path;

    // Determine which limiter to use based on the path
    let limiterKey = 'default';
    if (path.startsWith('/api/auth')) {
      limiterKey = 'auth';
    } else if (path.startsWith('/api/ai')) {
      limiterKey = 'ai';
    }

    const limiter = this.limiters[limiterKey] || this.limiters.default;

    return new Promise((resolve, reject) => {
      limiter(request, response, (err: any) => {
        if (err) {
          reject(
            new HttpException(
              'Too many requests',
              HttpStatus.TOO_MANY_REQUESTS,
            ),
          );
        } else {
          resolve(true);
        }
      });
    });
  }

  private createRateLimiter(windowMs: number, max: number) {
    const env = this.configService.get<string>('NODE_ENV', 'development');
    const isProduction = env === 'production';
    
    return rateLimit({
      windowMs: windowMs * 1000, // convert to milliseconds
      max,
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      message: {
        message: 'Too many requests, please try again later',
        error: 'Too Many Requests',
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
      },
      // In production, store in Redis or other distributed storage
      // This is a simple in-memory store for development
      keyGenerator: (req) => {
        // Use IP or user ID for tracking
        return req.user?.id || req.ip || req.headers['x-forwarded-for'] || 'unknown';
      },
      skip: (req) => {
        // Allow health checks to bypass rate limiting
        return req.path === '/api/health';
      }
    });
  }
}