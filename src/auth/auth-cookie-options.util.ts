import type { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';

export function isProductionEnv(configService: ConfigService): boolean {
  return Boolean(configService.get<boolean>('app.isProduction'));
}

/**
 * Frontend and backend live on entirely different registrable domains in
 * production, so SameSite=Lax/Strict can't be relied on for CSRF mitigation
 * there — sameSite:'none' is required for the cookie to be sent at all.
 * CsrfGuard (double-submit token) is what actually protects the routes that
 * depend on these cookies.
 */
export function buildAuthCookieOptions(
  configService: ConfigService,
  opts: { httpOnly: boolean },
): CookieOptions {
  const isProduction = isProductionEnv(configService);
  return {
    httpOnly: opts.httpOnly,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: configService.get<string>('cookie.path'),
  };
}

/**
 * ASVS V3.3.1: prefixes the cookie name with `__Secure-` in production,
 * which browsers enforce alongside `secure:true`. `__Host-` isn't used
 * because these cookies are scoped to /api/v1/auth, and `__Host-` requires
 * path:'/' with no domain attribute.
 */
export function withSecurePrefix(
  configService: ConfigService,
  baseName: string,
): string {
  return isProductionEnv(configService) ? `__Secure-${baseName}` : baseName;
}
