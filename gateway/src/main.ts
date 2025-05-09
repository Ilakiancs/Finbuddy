import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as compression from 'compression';
import * as helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { RateLimiterGuard } from './guards/rate-limiter.guard';

async function bootstrap() {
  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Get environment configuration
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const environment = configService.get<string>('NODE_ENV', 'development');
  const isProduction = environment === 'production';

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
      crossOriginEmbedderPolicy: isProduction,
      crossOriginOpenerPolicy: isProduction,
      crossOriginResourcePolicy: isProduction,
      hsts: isProduction,
      strictTransportSecurity: isProduction,
    }),
  );

  // Response compression
  app.use(compression());

  // CORS configuration
  const corsOrigins = configService.get<string>('CORS_ORIGINS', '*').split(',');
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
    }),
  );

  // Global rate limiting
  app.useGlobalGuards(new RateLimiterGuard());

  // Swagger API documentation
  if (!isProduction) {
    const options = new DocumentBuilder()
      .setTitle('FinBuddy API Gateway')
      .setDescription('FinBuddy Stealth API Gateway')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Start server
  await app.listen(port);
  console.log(`🚀 FinBuddy API Gateway running on port ${port} (${environment})`);
}

bootstrap();