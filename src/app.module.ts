import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
} from 'nestjs-i18n';
import { ProblemDetailFilter } from './common/filters/problem-detail.filter';
import {
  adminConfig,
  appConfig,
  awsConfig,
  cacheConfig,
  cookieConfig,
  corsConfig,
  jwtConfig,
  serviceKeyConfig,
  throttleConfig,
} from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ClientsModule } from './clients/clients.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { VehicleImagesModule } from './vehicle-images/vehicle-images.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { PurchaseSalesModule } from './purchase-sales/purchase-sales.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      load: [
        appConfig,
        jwtConfig,
        cookieConfig,
        corsConfig,
        throttleConfig,
        adminConfig,
        serviceKeyConfig,
        awsConfig,
        cacheConfig,
      ],
    }),
    CacheModule.register({ isGlobal: true }),
    I18nModule.forRoot({
      // Spanish and English both ship; Spanish is the native default and the
      // fallback the moment a resolver reports an unknown/unsupported locale.
      fallbackLanguage: 'es',
      // includeSubfolders is required: translations are organized per domain in
      // nested folders (es/users/*.json, es/common/*.json) and the loader skips
      // subfolders otherwise. The nested path becomes the key prefix, so
      // es/users/errors.json -> users.errors.<CODE>.
      loaderOptions: {
        path: join(__dirname, '/i18n/'),
        includeSubfolders: true,
        watch: true,
      },
      // Header-based only: every endpoint is auth-gated, so clients already
      // send an Authorization header and can set x-lang alongside it. A query
      // resolver would be rejected by the whitelist pipe on endpoints with a
      // validated query DTO, so localization is kept uniformly in headers.
      resolvers: [new HeaderResolver(['x-lang']), AcceptLanguageResolver],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    ClientsModule,
    VehiclesModule,
    VehicleImagesModule,
    // DashboardModule and ReportsModule register /purchase-sales/dashboard-summary
    // and /purchase-sales/report/:format; they must be imported BEFORE
    // PurchaseSalesModule so those static routes match before /purchase-sales/:id.
    DashboardModule,
    ReportsModule,
    PurchaseSalesModule,
  ],
  providers: [
    // Registered via DI (not app.useGlobalFilters) so it can inject I18nService
    // — the single place where translation keys become localized HTTP responses.
    { provide: APP_FILTER, useClass: ProblemDetailFilter },
  ],
})
export class AppModule {}
