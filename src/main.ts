import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';
import { SpaFallbackFilter } from './spa.filter';
import * as crypto from 'crypto';
import helmet from 'helmet';

// Polyfill for Node.js < 20 where crypto is not a global
if (!global.crypto) {
  (global as any).crypto = crypto;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. Security Headers (XSS protection, etc.)
  app.use(helmet());

  // 2. Global Validation Pipe (Strict input validation)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Enable CORS as early as possible with broad permissions for dev
  app.enableCors({
    origin: true, // Reflects the request origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new SpaFallbackFilter());

  app.useStaticAssets(join(__dirname, '..', 'generatedImages'));
  app.useStaticAssets(join(__dirname, '..', 'audioFile'));
  app.use(require('express').json({ limit: '50mb' }));
  app.use(require('express').urlencoded({ limit: '50mb', extended: true }));

  // Global request logger for debugging
  app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
  });

  await app.listen(process.env.PORT || 3000);
  console.log(`Backend Application is running on: ${process.env.SERVER_URL || 'http://localhost:3000'}`);
}
bootstrap();
