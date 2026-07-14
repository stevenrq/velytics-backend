import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().uri().required(),

  JWT_ISSUER: Joi.string().required(),
  JWT_PRIVATE_KEY_B64: Joi.string().when('JWT_PRIVATE_KEY_FILE', {
    is: Joi.exist(),
    then: Joi.forbidden(),
    otherwise: Joi.required(),
  }),
  JWT_PRIVATE_KEY_FILE: Joi.string(),
  JWT_PUBLIC_KEY_B64: Joi.string().when('JWT_PUBLIC_KEY_FILE', {
    is: Joi.exist(),
    then: Joi.forbidden(),
    otherwise: Joi.required(),
  }),
  JWT_PUBLIC_KEY_FILE: Joi.string(),
  JWT_ACCESS_TTL_SECONDS: Joi.number().default(900),
  JWT_REFRESH_TTL_DAYS: Joi.number().default(7),

  CORS_ALLOWED_ORIGINS: Joi.string().default('http://localhost:4200'),

  THROTTLE_AUTH_LIMIT: Joi.number().default(10),
  THROTTLE_AUTH_TTL_SECONDS: Joi.number().default(60),

  ADMIN_USERNAME: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string().default('admin'),
  }),
  ADMIN_PASSWORD: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string().default('Admin123!'),
  }),
  ADMIN_EMAIL: Joi.string()
    .email({ tlds: { allow: false } })
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.string().default('admin@velytics.local'),
    }),
  ADMIN_FIRST_NAME: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string().default('Admin'),
  }),
  ADMIN_LAST_NAME: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string().default('Velytics'),
  }),
  ADMIN_NATIONAL_ID: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string().default('1000000000'),
  }),
  ADMIN_PHONE_NUMBER: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string().default('3000000000'),
  }),

  SERVICE_API_KEY: Joi.string().min(32).required(),

  AWS_REGION: Joi.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  AWS_SECRET_ACCESS_KEY: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  AWS_S3_BUCKET: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  S3_UPLOAD_URL_TTL_SECONDS: Joi.number().default(600),
  S3_DOWNLOAD_URL_TTL_SECONDS: Joi.number().default(900),
  S3_MAX_IMAGE_SIZE_BYTES: Joi.number().default(10 * 1024 * 1024),

  DASHBOARD_CACHE_TTL_SECONDS: Joi.number().default(60),
});
