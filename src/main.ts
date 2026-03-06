/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(
    express.json({
      limit: '50mb',
      verify: (req: any, res, buf) => {
        if (req.originalUrl.includes('/webhooks/stripe')) {
          req.rawBody = buf;
        }
      },
    }),
  );

  // 5. Global Validation Pipe (Fixes Frontend 400 Errors)
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 4. Cookie Parser
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
      whitelist: true,
      // Frontend theke extra field ashar risk thake, tai eita false kora safe
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 6. CORS Configuration (Credentials enable kora must for cookies)
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'https://finn-frontend-flame.vercel.app',
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization',
  });

  // 7. Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('ByBench Marketplace API')
    .setDescription('The ByBench API description')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('accessToken')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  console.log(`Server is running on: http://localhost:${port}/docs`);
}
bootstrap();
