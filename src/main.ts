import 'reflect-metadata';
import { randomUUID } from 'crypto';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JsonLoggerService } from './common/logger/json-logger.service';

function toBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  const logger = app.get(JsonLoggerService);

  app.useLogger(logger);

  app.use((req: Request, res: Response, next: () => void) => {
    const requestIdHeader = req.headers['x-request-id'];
    const requestId = Array.isArray(requestIdHeader)
      ? requestIdHeader[0]
      : requestIdHeader ?? randomUUID();
    const startedAt = Date.now();

    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    res.on('finish', () => {
      logger.log({
        event: 'http_request',
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });

    next();
  });

  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter(logger));

  const corsEnabled = toBoolean(configService.get<string>('CORS_ENABLED'), true);
  if (corsEnabled) {
    const origins = configService
      .get<string>('CORS_ORIGIN', '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    app.enableCors({
      origin: origins.length > 0 ? origins : true,
      credentials: true,
    });
  }

  const swaggerEnabled = toBoolean(configService.get<string>('SWAGGER_ENABLED'), true);
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(configService.get<string>('SWAGGER_TITLE', 'Tienda API'))
      .setDescription(
        configService.get<string>(
          'SWAGGER_DESCRIPTION',
          'Backend Tienda Online - Autenticación JWT, RBAC, perfil de usuario y direcciones',
        ),
      )
      .setVersion(configService.get<string>('SWAGGER_VERSION', '1.0.0'))
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Placeholder para autenticacion JWT de fases siguientes',
        },
        'bearer',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    const swaggerPath = configService.get<string>('SWAGGER_PATH', 'docs');
    SwaggerModule.setup(`${apiPrefix}/${swaggerPath}`, app, document);
  }

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log({
    event: 'application_bootstrapped',
    service: 'api',
    port,
    apiPrefix,
    swaggerEnabled,
  });
}

void bootstrap();
