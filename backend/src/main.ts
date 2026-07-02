import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
    rawBody: true, // needed to verify Meta's X-Hub-Signature-256 on the WhatsApp webhook
  });

  const prefix = process.env.API_PREFIX ?? 'api/v1';
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',');

  app.setGlobalPrefix(prefix);
  app.use(helmet());
  app.enableCors({
    origin: origins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ERP API')
    .setDescription('ERP System — Backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${prefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/${prefix}`);
  console.log(`📚 Swagger on   http://localhost:${port}/${prefix}/docs`);
}

bootstrap().catch((err: unknown) => {
  console.error('Failed to start application', err);
  process.exit(1);
});
