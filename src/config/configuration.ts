import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  isProduction: process.env.NODE_ENV === 'production',
}));

export const jwtConfig = registerAs('jwt', () => ({
  issuer: process.env.JWT_ISSUER,
  privateKeyB64: process.env.JWT_PRIVATE_KEY_B64,
  privateKeyFile: process.env.JWT_PRIVATE_KEY_FILE,
  publicKeyB64: process.env.JWT_PUBLIC_KEY_B64,
  publicKeyFile: process.env.JWT_PUBLIC_KEY_FILE,
  accessTtlSeconds: parseInt(process.env.JWT_ACCESS_TTL_SECONDS ?? '900', 10),
  refreshTtlDays: parseInt(process.env.JWT_REFRESH_TTL_DAYS ?? '7', 10),
}));

export const cookieConfig = registerAs('cookie', () => ({
  name: 'refresh_token',
  csrfName: 'csrf_token',
  path: '/api/v1/auth',
}));

export const corsConfig = registerAs('cors', () => ({
  allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim()),
}));

export const throttleConfig = registerAs('throttle', () => ({
  authLimit: parseInt(process.env.THROTTLE_AUTH_LIMIT ?? '10', 10),
  authTtlSeconds: parseInt(process.env.THROTTLE_AUTH_TTL_SECONDS ?? '60', 10),
}));

export const adminConfig = registerAs('admin', () => ({
  username: process.env.ADMIN_USERNAME ?? 'admin',
  password: process.env.ADMIN_PASSWORD ?? 'Admin123!',
  email: process.env.ADMIN_EMAIL ?? 'admin@velytics.local',
  firstName: process.env.ADMIN_FIRST_NAME ?? 'Admin',
  lastName: process.env.ADMIN_LAST_NAME ?? 'Velytics',
  nationalId: process.env.ADMIN_NATIONAL_ID ?? '1000000000',
  phoneNumber: process.env.ADMIN_PHONE_NUMBER ?? '3000000000',
}));

export const serviceKeyConfig = registerAs('serviceKey', () => ({
  key: process.env.SERVICE_API_KEY,
}));

export const awsConfig = registerAs('aws', () => ({
  region: process.env.AWS_REGION ?? 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  bucket: process.env.AWS_S3_BUCKET,
  uploadUrlTtlSeconds: parseInt(
    process.env.S3_UPLOAD_URL_TTL_SECONDS ?? '600',
    10,
  ),
  downloadUrlTtlSeconds: parseInt(
    process.env.S3_DOWNLOAD_URL_TTL_SECONDS ?? '900',
    10,
  ),
}));

export const cacheConfig = registerAs('cache', () => ({
  dashboardTtlSeconds: parseInt(
    process.env.DASHBOARD_CACHE_TTL_SECONDS ?? '60',
    10,
  ),
}));

export type AppConfig = ReturnType<typeof appConfig>;
export type JwtConfig = ReturnType<typeof jwtConfig>;
export type CookieConfig = ReturnType<typeof cookieConfig>;
export type CorsConfig = ReturnType<typeof corsConfig>;
export type ThrottleConfig = ReturnType<typeof throttleConfig>;
export type AdminConfig = ReturnType<typeof adminConfig>;
export type ServiceKeyConfig = ReturnType<typeof serviceKeyConfig>;
export type AwsConfig = ReturnType<typeof awsConfig>;
export type CacheConfig = ReturnType<typeof cacheConfig>;
