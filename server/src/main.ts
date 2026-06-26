import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix: all routes under /api/v1
  app.setGlobalPrefix('api/v1');

  // Enable CORS for all origins (web + mobile clients)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Increase body size limit for file uploads
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`🚀 Billaro API server running on http://localhost:${port}/api/v1`);
}
bootstrap();
