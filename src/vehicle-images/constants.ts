// @Max(...) below needs a literal at class-definition time, before Nest's DI
// container (and ConfigService) exists — same constraint as AUTH_THROTTLE in
// auth.controller.ts. dotenv/config is a no-op in deployed environments,
// where the real env var is already set before Node starts.
import 'dotenv/config';

// ASVS V5.2.1: caps declared upload size so a client cannot claim an
// arbitrarily large file. Enforced on both the presign request (early
// rejection) and the confirm request (checked against the real S3 object).
export const MAX_IMAGE_SIZE_BYTES = parseInt(
  process.env.S3_MAX_IMAGE_SIZE_BYTES ?? String(10 * 1024 * 1024), // 10 MB
  10,
);
