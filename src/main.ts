import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.ALLOWED_ORIGIN,
      credentials: true,
      allowedHeaders: [
        'Accept',
        'Content-Type',
        'Authorization',
        'X-CSRF-Token',
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    },
  });
  app.setGlobalPrefix('api/v1');
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v1',
  });

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('Api Documentation')
    .setDescription('The UrPrint API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
