# Velytics Backend

Management API for a used-vehicle dealership, built as a **NestJS monolith**. It is the *greenfield* migration of the `sgivu` project's Spring microservices (auth, user, client, vehicle, purchase-sale) into a single API using the official NestJS libraries: `@nestjs/config`, `@nestjs/jwt`, `@nestjs/swagger`, `@nestjs/terminus`, `@nestjs/cache-manager`, `@nestjs/throttler`, Prisma ORM, `class-validator`/`class-transformer`, Jest + Supertest.

The frontend (Angular + Tailwind + PrimeNG) and the demand-prediction API (FastAPI) will be rebuilt afterwards to consume this API — the design is API-first, with no compatibility constraints from the previous system.

> A Spanish version of this document is available at [README.es.md](README.es.md).

## Language policy

- **Source code and technical docs are in English** — identifiers, logs, internal exceptions, inline comments, TSDoc/JSDoc and Swagger descriptions.
- **End-user text is in Spanish, served through i18n** (`nestjs-i18n`), never hardcoded. Error messages, DTO validation messages and HTTP response bodies are resolved from translation files under `src/i18n/es/`. Spanish is the fallback language and, today, the only shipped one; the resolvers (`?lang=`, `x-lang` header, `Accept-Language`) are wired so a second language is a translation-files change, not a code change.

## Stack

| Area | Technology |
| --- | --- |
| Framework | NestJS 11 (Express), Node 22, TypeScript |
| Database | PostgreSQL 18 (local) via Prisma ORM (single schema, no microservices) |
| Authentication | **RS256** access JWT (15 min) + opaque refresh token with **rotation and reuse detection** (7 days, HttpOnly cookie) |
| Authorization | RBAC — static, code-owned permissions (`resource:action`), global guards |
| Internationalization | `nestjs-i18n` (Spanish fallback), per-domain translation files |
| Documentation | Swagger/OpenAPI at `/docs` |
| Images | AWS S3 with presigned URLs (direct browser upload) |
| Reports | PDF (`pdfmake`), Excel (`exceljs`), CSV (`csv-stringify`) |
| Cache | in-memory `@nestjs/cache-manager` (dashboard, token denylist) |
| Deployment | Docker, Render (`render.yaml`) |

## Local setup

Requirements: Node 22, Docker.

```bash
npm install
docker compose up -d postgres      # PostgreSQL 18 on localhost:5433
cp .env.example .env                # fill in JWT_PRIVATE_KEY_B64/JWT_PUBLIC_KEY_B64 (see below)
npm run db:migrate                  # apply migrations
npm run db:seed                     # RBAC + admin + deterministic demo data
npm run start:dev
```

The API is served at `http://localhost:3000/api/v1`, Swagger at `http://localhost:3000/docs`, health at `GET /api/v1/health`.

### Generate the RS256 key pair for development

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.pem
openssl rsa -pubout -in private.pem -out public.pem
echo "JWT_PRIVATE_KEY_B64=$(base64 -w0 private.pem)"
echo "JWT_PUBLIC_KEY_B64=$(base64 -w0 public.pem)"
```

Paste those values into `.env`. In production (Render), `JWT_PRIVATE_KEY_FILE`/`JWT_PUBLIC_KEY_FILE` point at Render Secret Files instead of the `_B64` variables.

## Environment variables

See `.env.example` for the full list with defaults. The most relevant ones:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ISSUER` | `iss` claim of issued JWTs; must match what the future ML API validates |
| `JWT_PRIVATE_KEY_B64` / `_FILE` | RSA private key (one of the two, mutually exclusive) |
| `JWT_PUBLIC_KEY_B64` / `_FILE` | RSA public key |
| `SERVICE_API_KEY` | Shared key for service-to-service calls (e.g. from the future ML API) via the `X-Service-Key` header |
| `ADMIN_USERNAME`/`ADMIN_PASSWORD`/... | Credentials of the admin user seeded on startup |
| `AWS_*` | S3 credentials and bucket for vehicle images |
| `CORS_ALLOWED_ORIGINS` | Allowed origins (comma-separated); must include the frontend domain |

## Seeds

`npm run db:seed` always reconciles the permission catalog, the `ADMIN`/`USER` roles and the admin user (idempotent, also runs on every app startup). When `NODE_ENV != production`, it additionally loads deterministic demo data ported from the sgivu seeds (`prisma/seed/sql/*.sql`, `setseed(0.42)`):

- 350 clients (300 persons + 50 companies)
- ~6,600 vehicles (19 motorcycle segments + 20 car segments, 36 months of history)
- ~11,750 purchase-sale contracts (aligned with the inventory, with status history)

Demo users: `responsable2`..`responsable16`, password `Passw0rd1!` (`responsable2`..`responsable9` also have the ADMIN role).

`npm run db:reset` fully resets the database and re-seeds it (**destructive**, development only).

## RBAC

Permissions are a **static, code-owned** catalog (`src/auth/permissions.catalog.ts`) with 39 `resource:action` entries (`user`, `role`, `permission`, `person`, `company`, `vehicle`, `car`, `motorcycle`, `purchase_sale` × `create|read|update|delete`, plus `ml:predict`, `ml:retrain`, `ml:models`). The `permissions` table is only a projection reconciled on startup and is never edited by hand. A test (`src/auth/permissions-drift.spec.ts`) fails if a controller references a permission missing from the catalog.

There is no public sign-up — it is an internal system; users are created by an administrator via `POST /api/v1/users`.

## Integration with the future ML API

- `GET /.well-known/jwks.json` (public, no version prefix): exposes the RS256 public key so the ML API can validate JWTs issued by this backend. The `iss` claim must match `JWT_ISSUER`.
- The frontend will call the ML API directly with the same `accessToken` (Bearer) — this backend does **not** proxy to ML.
- The ML API reads data from this backend with the `X-Service-Key: <SERVICE_API_KEY>` header instead of a JWT, on endpoints marked `@AllowServiceKey()`:
  - `GET /api/v1/purchase-sales` (`startDate`/`endDate`/pagination filters)
  - `GET /api/v1/cars/:id`, `GET /api/v1/motorcycles/:id`

## Vehicle images (S3)

Two-step upload flow: `POST /api/v1/vehicles/:id/images/presigned-upload` returns a presigned URL (PUT, 10 min) so the browser uploads the file directly to S3; then `POST /api/v1/vehicles/:id/images/confirm-upload` validates and registers the image. `GET` returns presigned download URLs (15 min).

**S3 bucket CORS is infrastructure configuration, not application configuration** — it must be set manually on the bucket (allowing `GET, PUT, POST, DELETE, HEAD` from the frontend origin(s)). The previous version (sgivu) mutated it on every startup via `@PostConstruct`; that practice was removed because it required broad IAM permissions, raced across instances and could overwrite external configuration.

## Deliberate differences from sgivu

- No `/batch` endpoints (they existed for inter-microservice communication; in a monolith they are direct queries).
- `User` no longer has `accountNonExpired`/`accountNonLocked`/`credentialsNonExpired`, only `enabled`.
- Contracts now have **real FKs** to `clients`/`users`/`vehicles` (previously loose columns with no referential integrity across databases); deleting an entity referenced by a contract now fails with 409.
- Vehicle status is synchronized transactionally with the sale lifecycle (`SALE` completed → `SOLD`; canceled → `AVAILABLE` if it was `SOLD`) — previously two independent sources of truth.
- No "delete only in dev profile" restriction; the `purchase_sale:delete` permission + `CANCELED` status rule is the only guard.
- No public sign-up (never existed in sgivu; documented explicitly here).
- Dashboard buckets (`dailySales`/`dailyPurchases`) group by calendar day in raw UTC (`day`, `YYYY-MM-DD`), with no timezone conversion — unlike sgivu's monthly buckets. The server and database stay strictly in UTC; aggregating these days into months (or any other unit) in Bogotá time is the frontend's responsibility.
- The `term` free-text search on `/purchase-sales` includes partial matching on type/status/payment method (e.g. `pend` matches `PENDING`), like sgivu's `LIKE` — plus exact matching when the term is a numeric id or price.

## Tests

```bash
npm test              # unit
npm run test:e2e       # e2e (Supertest, requires Postgres up and seeded)
npm run test:cov       # coverage
```

## Docker

```bash
docker compose up --build     # full PostgreSQL + API
```

The API container runs `npx prisma migrate deploy` before starting.

## Deploying on Render

`render.yaml` defines a blueprint: a Docker web service + managed PostgreSQL. Before deploying:

1. Upload the RSA key pair as **Render Secret Files** (`jwt-private.pem`, `jwt-public.pem`).
2. Fill in, in the Render dashboard, the variables marked `sync: false` in `render.yaml` (`JWT_ISSUER`, `CORS_ALLOWED_ORIGINS`, admin credentials, AWS credentials).
3. Render runs `prisma migrate deploy` automatically when the container starts (the same `CMD` as the `Dockerfile`).

## Security

Baseline controls implemented to close OWASP ASVS 5.0 Level 1 gaps:

- **Rate limiting**: `POST /auth/login`, `/auth/refresh` and `GET /auth/csrf-token` are throttled independently from the rest of the API (`THROTTLE_AUTH_LIMIT`/`THROTTLE_AUTH_TTL_SECONDS`, default 10 requests / 60s), on top of the global `ThrottlerGuard`.
- **CSRF (double-submit cookie)**: `/auth/refresh` and `/auth/logout` rely on cookies and are additionally guarded by `CsrfGuard` (`@RequireCsrf()`). The frontend must echo the `csrfToken` returned by `/auth/login` (or refreshed via `GET /auth/csrf-token`) as the `X-CSRF-Token` header on those two calls. This is required because the frontend and this API are on different registrable domains in production, so `SameSite` alone cannot mitigate CSRF there.
- **Cookie hardening**: the `refresh_token` and `csrf_token` cookies are prefixed `__Secure-` in production (`app.isProduction`), `httpOnly`+`secure`+`sameSite` set accordingly (see `src/auth/auth-cookie-options.util.ts`).
- **Password policy**: length-only (8–72 characters), no forced composition rules, per ASVS V6.2.1/V6.2.5. New/changed passwords are checked against the Have I Been Pwned breach corpus via k-anonymity (`PasswordPolicyService`); the check **fails open** if the third-party API is unavailable, so registration/login are never blocked by an external outage.
- **Self-service password change**: `PUT /users/:id` requires the caller's current password (`currentPassword`) when a user changes their own password. An admin resetting another user's password via `user:update` is exempt.
- **Session revocation on disable/delete**: disabling a user (`PATCH /users/:id/status`) or deleting one revokes all of their refresh tokens (`RefreshTokenService.revokeAllForUser`); `AuthService.refresh()` also rejects a disabled account outright. Already-issued access tokens remain valid until their short TTL (15 min) expires — this is the accepted tradeoff, since there's no per-user access-token denylist (only per-`jti`).
- **Upload size cap**: vehicle image uploads are capped at `S3_MAX_IMAGE_SIZE_BYTES` (default 10 MB), enforced on both the presign request and the confirm request.
- **Dependency scanning**: CI runs `npm audit --audit-level=high` on every push/PR; Dependabot (`.github/dependabot.yml`) opens weekly update PRs for npm and GitHub Actions dependencies. See `SECURITY.md` for the vulnerability-reporting process.
- **Admin bootstrap**: `ADMIN_USERNAME`/`ADMIN_PASSWORD`/etc. are `required` (no insecure defaults) whenever `NODE_ENV=production` (`src/config/env.validation.ts`); the convenience defaults only ever apply outside production.

## Scaling notes

The cache (dashboard, revoked-token denylist) uses the in-memory store of `@nestjs/cache-manager`, valid for **a single instance**. Before scaling horizontally on Render, switch the store to Redis/Keyv (`CacheModule.registerAsync` with `@keyv/redis`) without touching business code.
