import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { BladeRoutingModule } from './proxy/blade-routing.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration module for environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('15m'),
        CORS_ORIGINS: Joi.string().default('*'),
        // Service endpoints
        AUTH_SERVICE_URL: Joi.string().required(),
        EXPENSE_SERVICE_URL: Joi.string().required(),
        BUDGET_SERVICE_URL: Joi.string().required(),
        GOALS_SERVICE_URL: Joi.string().required(),
        INSIGHTS_SERVICE_URL: Joi.string().required(),
        CHAT_SERVICE_URL: Joi.string().required(),
        AI_INFERENCE_SERVICE_URL: Joi.string().required(),
        SYNC_SERVICE_URL: Joi.string().required(),
        NOTIFICATION_SERVICE_URL: Joi.string().required(),
        DATA_SERVICE_URL: Joi.string().required(),
      }),
    }),
    // JWT module for token validation
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '15m'),
        },
      }),
    }),
    // Passport for authentication strategies
    PassportModule.register({ defaultStrategy: 'jwt' }),
    
    // Feature modules
    AuthModule,
    BladeRoutingModule,
    HealthModule,
  ],
  providers: [
    // Global JWT guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}