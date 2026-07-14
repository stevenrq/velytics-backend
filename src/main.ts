import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { I18nValidationPipe } from 'nestjs-i18n';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: configService.get<string[]>('cors.allowedOrigins'),
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Lang',
      'X-Service-Key',
    ],
  });

  app.setGlobalPrefix('api', {
    exclude: ['.well-known/jwks.json'],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // I18nValidationPipe resolves the request locale at runtime, so DTO
  // validation messages come back localized. The global exception filter is
  // registered as an APP_FILTER provider in AppModule (needs I18nService via DI).
  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Velytics API')
    .setDescription(
      'Management API for the Velytics used-vehicle dealership system.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication: login, session refresh and logout.')
    .addTag('persons', 'Natural-person client management.')
    .addTag('companies', 'Company client management.')
    .addTag('users', 'System user management.')
    .addTag('roles', 'Role management and their assigned permissions.')
    .addTag('permissions', 'Catalog of available permissions (read-only).')
    .addTag('cars', 'Car inventory.')
    .addTag('motorcycles', 'Motorcycle inventory.')
    .addTag('vehicle-images', 'Vehicle image upload and management.')
    .addTag('purchase-sales', 'Vehicle purchase and sale contracts.')
    .addTag('dashboard', 'Aggregated metrics for the main panel.')
    .addTag('reports', 'Contract export to PDF, Excel or CSV.')
    .addTag('health', 'Application health check.')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port);
}
void bootstrap();
