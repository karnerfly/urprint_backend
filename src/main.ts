import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import NAMES from './constants/name';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: process.env.ALLOWED_ORIGIN,
      credentials: true,
      allowedHeaders: [
        'Accept',
        'Content-Type',
        'Authorization',
        'X-Csrf-Token',
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    },
  });

  app.set('trust proxy', 1);
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
  });

  app.use(cookieParser());
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`, 'cdnjs.cloudflare.com'],
          imgSrc: [`'self'`, 'data:', 'cdnjs.cloudflare.com'],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
          manifestSrc: [`'self'`, 'cdnjs.cloudflare.com'],
          frameSrc: [`'self'`, 'cdnjs.cloudflare.com'],
        },
      },
      xssFilter: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Api Documentation')
    .setDescription('The UrPrint API description')
    .setVersion('1.0')
    // .addBearerAuth(
    //   {
    //     type: 'http',
    //     scheme: 'bearer',
    //     bearerFormat: 'JWT',
    //     in: 'header',
    //   },
    //   'access-token',
    // )
    .addCookieAuth(NAMES.COOKIE.AUTH_SESSION, {
      type: 'apiKey',
      in: 'cookie',
    })
    .addSecurity('csrf', {
      type: 'apiKey',
      name: NAMES.HEADER.CSRF_TOKEN,
      in: 'header',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);

  for (const path of Object.values(document.paths)) {
    for (const [method, operation] of Object.entries(path)) {
      if (!['get', 'options', 'head'].includes(method.toLocaleLowerCase())) {
        operation.security = [...(operation.security ?? []), { csrf: [] }];
      }
    }
  }

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'UrPrint Documentation',
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
    ],
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((error) => console.error('APPLICATION ERROR: ', error));
