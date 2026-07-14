# Velytics Backend

> La documentación principal está en inglés: [README.md](README.md). Esta es la traducción al español.

API del sistema de gestión de una concesionaria de vehículos usados, construida como **monolito NestJS**. Es la migración *greenfield* de los microservicios Spring del proyecto `sgivu` (auth, user, client, vehicle, purchase-sale) a una única API con librerías oficiales de NestJS: `@nestjs/config`, `@nestjs/jwt`, `@nestjs/swagger`, `@nestjs/terminus`, `@nestjs/cache-manager`, `@nestjs/throttler`, Prisma ORM, `class-validator`/`class-transformer`, Jest + Supertest.

El frontend (Angular + Tailwind + PrimeNG) y la API de predicción de demanda (FastAPI) se reconstruirán después para consumir esta API — el diseño es API-first, sin restricciones de compatibilidad con el sistema anterior.

## Stack

| Área | Tecnología |
| --- | --- |
| Framework | NestJS 11 (Express), Node 22, TypeScript |
| Base de datos | PostgreSQL 18 (local) vía Prisma ORM (esquema único, sin microservicios) |
| Autenticación | JWT de acceso **RS256** (15 min) + refresh token opaco con **rotación y detección de reuso** (7 días, cookie HttpOnly) |
| Autorización | RBAC — permisos estáticos en código (`recurso:accion`), guards globales |
| Documentación | Swagger/OpenAPI en `/docs` |
| Imágenes | AWS S3 con URLs prefirmadas (subida directa desde el navegador) |
| Reportes | PDF (`pdfmake`), Excel (`exceljs`), CSV (`csv-stringify`) |
| Caché | `@nestjs/cache-manager` en memoria (dashboard, denylist de tokens) |
| Despliegue | Docker, Render (`render.yaml`) |

## Puesta en marcha local

Requisitos: Node 22, Docker.

```bash
npm install
docker compose up -d postgres      # PostgreSQL 18 en localhost:5433
cp .env.example .env                # completar JWT_PRIVATE_KEY_B64/JWT_PUBLIC_KEY_B64 (ver abajo)
npm run db:migrate                  # aplica las migraciones
npm run db:seed                     # RBAC + admin + datos demo deterministas
npm run start:dev
```

La API queda en `http://localhost:3000/api/v1`, Swagger en `http://localhost:3000/docs`, salud en `GET /api/v1/health`.

### Generar el par de claves RS256 para desarrollo

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.pem
openssl rsa -pubout -in private.pem -out public.pem
echo "JWT_PRIVATE_KEY_B64=$(base64 -w0 private.pem)"
echo "JWT_PUBLIC_KEY_B64=$(base64 -w0 public.pem)"
```

Pega esos valores en `.env`. En producción (Render) se usan `JWT_PRIVATE_KEY_FILE`/`JWT_PUBLIC_KEY_FILE` apuntando a Render Secret Files en vez de las variables `_B64`.

## Variables de entorno

Ver `.env.example` para la lista completa con valores por defecto. Las más relevantes:

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión PostgreSQL |
| `JWT_ISSUER` | Claim `iss` de los JWT emitidos; debe coincidir con lo que valide la futura API de ML |
| `JWT_PRIVATE_KEY_B64` / `_FILE` | Clave privada RSA (una de las dos, mutuamente excluyentes) |
| `JWT_PUBLIC_KEY_B64` / `_FILE` | Clave pública RSA |
| `SERVICE_API_KEY` | Clave compartida para llamadas servicio-a-servicio (p. ej. desde la futura API de ML) vía header `X-Service-Key` |
| `ADMIN_USERNAME`/`ADMIN_PASSWORD`/... | Credenciales del usuario administrador sembrado al arrancar |
| `AWS_*` | Credenciales y bucket de S3 para imágenes de vehículos |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos (coma-separados), debe incluir el dominio del frontend |

## Seeds

`npm run db:seed` siempre reconcilia el catálogo de permisos, los roles `ADMIN`/`USER` y el usuario administrador (idempotente, corre también en cada arranque de la app). Si `NODE_ENV != production`, además carga datos demo deterministas portados de los seeds de sgivu (`prisma/seed/sql/*.sql`, `setseed(0.42)`):

- 350 clientes (300 personas + 50 empresas)
- ~6.600 vehículos (19 segmentos de motos + 20 de carros, 36 meses de histórico)
- ~11.750 contratos de compraventa (alineados con el inventario, con historial de estados)

Usuarios demo: `responsable2`..`responsable16`, contraseña `Passw0rd1!` (`responsable2`..`responsable9` tienen también rol ADMIN).

`npm run db:reset` reinicia la base de datos por completo y vuelve a sembrar (**destructivo**, solo para desarrollo).

## RBAC

Los permisos son un catálogo **estático en código** (`src/auth/permissions.catalog.ts`), con 39 entradas `recurso:accion` (`user`, `role`, `permission`, `person`, `company`, `vehicle`, `car`, `motorcycle`, `purchase_sale` × `create|read|update|delete`, más `ml:predict`, `ml:retrain`, `ml:models`). La tabla `permissions` es solo una proyección reconciliada al arrancar; nunca se edita a mano. Un test (`src/auth/permissions-drift.spec.ts`) falla si algún controller referencia un permiso que no está en el catálogo.

No hay registro público — es un sistema interno; los usuarios los crea un administrador vía `POST /api/v1/users`.

## Integración con la futura API de ML

- `GET /.well-known/jwks.json` (público, sin prefijo de versión): expone la clave pública RS256 para que la API de ML valide los JWT emitidos por este backend. El claim `iss` debe coincidir con `JWT_ISSUER`.
- El frontend llamará a la API de ML directamente con el mismo `accessToken` (Bearer) — este backend **no** actúa de proxy hacia ML.
- La API de ML consulta datos de este backend con el header `X-Service-Key: <SERVICE_API_KEY>` en lugar de un JWT, en los endpoints marcados `@AllowServiceKey()`:
  - `GET /api/v1/purchase-sales` (filtros `startDate`/`endDate`/paginación)
  - `GET /api/v1/cars/:id`, `GET /api/v1/motorcycles/:id`

## Imágenes de vehículos (S3)

Flujo de subida en dos pasos: `POST /api/v1/vehicles/:id/images/presigned-upload` devuelve una URL prefirmada (PUT, 10 min) para que el navegador suba el archivo directo a S3; luego `POST /api/v1/vehicles/:id/images/confirm-upload` valida y registra la imagen. `GET` devuelve URLs de descarga prefirmadas (15 min).

**El CORS del bucket S3 es configuración de infraestructura, no de la aplicación** — debe configurarse manualmente en el bucket (permitiendo `GET, PUT, POST, DELETE, HEAD` desde el/los orígenes del frontend). La versión anterior (sgivu) lo mutaba en cada arranque vía `@PostConstruct`; se eliminó esa práctica porque requería permisos IAM amplios, competía entre instancias y podía pisar configuración externa.

## Diferencias deliberadas frente a sgivu

- Sin endpoints `/batch` (eran para comunicación entre microservicios; en un monolito son consultas directas).
- `User` ya no tiene `accountNonExpired`/`accountNonLocked`/`credentialsNonExpired`, solo `enabled`.
- Los contratos ahora tienen **FKs reales** hacia `clients`/`users`/`vehicles` (antes eran columnas sueltas sin integridad referencial entre bases de datos); borrar una entidad referenciada por un contrato ahora falla con 409.
- El estado del vehículo se sincroniza transaccionalmente con el ciclo de vida de la venta (`SALE` completada → `SOLD`; cancelada → `AVAILABLE` si estaba `SOLD`) — antes eran dos fuentes de verdad independientes.
- Sin restricción "solo se puede borrar en perfil dev"; el permiso `purchase_sale:delete` + regla de estado `CANCELED` es la única guarda.
- Sin registro público (nunca existió en sgivu; aquí se documenta explícitamente).
- Los buckets del dashboard (`dailySales`/`dailyPurchases`) agrupan por día calendario en UTC crudo (`day`, `YYYY-MM-DD`), sin conversión de zona horaria — a diferencia de los buckets mensuales de sgivu. El servidor y la base de datos se mantienen estrictamente en UTC; agregar estos días en meses (o cualquier otra unidad) en hora de Bogotá es responsabilidad del frontend.
- La búsqueda libre `term` en `/purchase-sales` incluye coincidencia parcial sobre el tipo/estado/método de pago (p. ej. `pend` encuentra `PENDING`), igual que el `LIKE` de sgivu — además de coincidencia exacta cuando el término es un id o precio numérico.

## Pruebas

```bash
npm test              # unit
npm run test:e2e       # e2e (Supertest, requiere Postgres levantado y sembrado)
npm run test:cov       # cobertura
```

## Docker

```bash
docker compose up --build     # PostgreSQL + API completos
```

El contenedor de la API corre `npx prisma migrate deploy` antes de arrancar.

## Despliegue en Render

`render.yaml` define un blueprint: servicio web Docker + PostgreSQL administrado. Antes de desplegar:

1. Sube el par de claves RSA como **Render Secret Files** (`jwt-private.pem`, `jwt-public.pem`).
2. Completa en el dashboard de Render las variables marcadas `sync: false` en `render.yaml` (`JWT_ISSUER`, `CORS_ALLOWED_ORIGINS`, credenciales del admin, credenciales de AWS).
3. Render ejecuta `prisma migrate deploy` automáticamente al iniciar el contenedor (mismo `CMD` del `Dockerfile`).

## Seguridad

Controles base implementados para cerrar los gaps de OWASP ASVS 5.0 Nivel 1:

- **Rate limiting**: `POST /auth/login`, `/auth/refresh` y `GET /auth/csrf-token` tienen throttling independiente del resto de la API (`THROTTLE_AUTH_LIMIT`/`THROTTLE_AUTH_TTL_SECONDS`, default 10 solicitudes / 60s), además del `ThrottlerGuard` global.
- **CSRF (double-submit cookie)**: `/auth/refresh` y `/auth/logout` dependen de cookies y están además protegidos por `CsrfGuard` (`@RequireCsrf()`). El frontend debe reenviar el `csrfToken` devuelto por `/auth/login` (o renovado vía `GET /auth/csrf-token`) como header `X-CSRF-Token` en esas dos llamadas. Esto es necesario porque el frontend y esta API viven en dominios registrables distintos en producción, así que `SameSite` por sí solo no mitiga CSRF ahí.
- **Endurecimiento de cookies**: las cookies `refresh_token` y `csrf_token` llevan el prefijo `__Secure-` en producción (`app.isProduction`), con `httpOnly`+`secure`+`sameSite` configurados según corresponda (ver `src/auth/auth-cookie-options.util.ts`).
- **Política de contraseña**: solo longitud (8–72 caracteres), sin reglas de composición forzadas, según ASVS V6.2.1/V6.2.5. Las contraseñas nuevas/cambiadas se verifican contra el corpus de brechas de Have I Been Pwned vía k-anonimato (`PasswordPolicyService`); la verificación **falla abierta** si la API de terceros no está disponible, así que el registro/login nunca se bloquea por una caída externa.
- **Auto-cambio de contraseña**: `PUT /users/:id` exige la contraseña actual (`currentPassword`) cuando un usuario cambia su propia contraseña. Un admin reseteando la contraseña de otro usuario vía `user:update` está exento.
- **Revocación de sesión al deshabilitar/eliminar**: deshabilitar un usuario (`PATCH /users/:id/status`) o eliminarlo revoca todos sus refresh tokens (`RefreshTokenService.revokeAllForUser`); `AuthService.refresh()` también rechaza directamente una cuenta deshabilitada. Los access tokens ya emitidos siguen válidos hasta que expira su TTL corto (15 min) — este es el tradeoff aceptado, ya que no hay denylist de access tokens por usuario (solo por `jti`).
- **Límite de tamaño de subida**: las imágenes de vehículos están limitadas a `S3_MAX_IMAGE_SIZE_BYTES` (default 10 MB), aplicado tanto en la solicitud de presign como en la de confirmación.
- **Escaneo de dependencias**: CI ejecuta `npm audit --audit-level=high` en cada push/PR; Dependabot (`.github/dependabot.yml`) abre PRs de actualización semanales para dependencias de npm y GitHub Actions. Ver `SECURITY.md` para el proceso de reporte de vulnerabilidades.
- **Bootstrap del admin**: `ADMIN_USERNAME`/`ADMIN_PASSWORD`/etc. son `required` (sin defaults inseguros) cuando `NODE_ENV=production` (`src/config/env.validation.ts`); los defaults de conveniencia solo aplican fuera de producción.

## Notas de escalado

La caché (dashboard, denylist de tokens revocados) usa el store en memoria de `@nestjs/cache-manager`, válido para **una sola instancia**. Antes de escalar horizontalmente en Render, cambiar el store por Redis/Keyv (`CacheModule.registerAsync` con `@keyv/redis`) sin tocar el código de negocio.
