import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { SpaFallbackFilter } from './spa.filter';
import * as crypto from 'crypto';

// Polyfill for Node.js < 20 where crypto is not a global
if (!global.crypto) {
  (global as any).crypto = crypto;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
  app.use(require('body-parser').urlencoded({ extended: true }));

  // Global request logger for debugging
  app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
  });

  await app.listen(process.env.PORT || 3000);
  console.log(`Backend Application is running on: ${process.env.SERVER_URL || 'http://localhost:3000'}`);
}
bootstrap();
