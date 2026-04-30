process.env.TZ = 'America/Sao_Paulo';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AllExceptionsFilter } from './common/filters';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // ── Arquivos estáticos (uploads)
  app.useStaticAssets(path.join(process.cwd(), 'public'), {
    prefix: '/',
  });

  // ── Prefixo global das rotas
  app.setGlobalPrefix('api/v1');

  // ── Body parsing
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // ── CORS
  const allowedOrigins = process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL, 'http://localhost:3000']
      : ['http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      // Permite requests sem origin (ex: Postman, curl, mobile)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Length', 'Content-Disposition'],
  });

  // ── Validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Filtros globais
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CrossFit Arena API')
    .setDescription('API de gestão de campeonatos de CrossFit')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .addServer('http://localhost:3004', 'Local Development')
    .addTag('Auth', 'Autenticação')
    .addTag('Campeonatos', 'Gestão de campeonatos')
    .addTag('Inscricoes', 'Inscrições')
    .addTag('Usuarios', 'Gestão de usuários')
    .addTag('Upload', 'Upload de arquivos')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // ── Start
  const PORT = process.env.PORT ?? 3004;
  await app.listen(PORT);
  logger.log(`Rodando em: http://localhost:${PORT}`);
  logger.log(`Swagger: http://localhost:${PORT}/api/docs`);
  logger.log(`Ambiente: ${process.env.NODE_ENV}`);
}

bootstrap().catch((err) => {
  console.error('Falha ao iniciar:', err);
  process.exit(1);
});
