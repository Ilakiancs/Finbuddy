import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as compression from 'compression';
import * as helmet from 'helmet';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // Create the NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Get environment configuration
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const environment = configService.get<string>('NODE_ENV', 'development');
  const isProduction = environment === 'production';

  // Apply security headers
  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
      crossOriginEmbedderPolicy: isProduction,
      crossOriginOpenerPolicy: isProduction,
      crossOriginResourcePolicy: isProduction,
    }),
  );

  // Enable compression
  app.use(compression());

  // Configure global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
    }),
  );

  // Configure API prefix - All endpoints will be under /api
  app.setGlobalPrefix('api');

  // Setup Swagger documentation in non-production environments
  if (!isProduction) {
    const options = new DocumentBuilder()
      .setTitle('FinBuddy Expense Blade')
      .setDescription('API for managing expenses in FinBuddy')
      .setVersion('1.0')
      .addTag('expenses')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Start server
  await app.listen(port);
  console.log(`🚀 FinBuddy Expense Blade running on port ${port} (${environment})`);
}

bootstrap();