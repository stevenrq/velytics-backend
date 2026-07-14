import type { ConfigService } from '@nestjs/config';
import { RefreshCookieFactory } from './refresh-cookie.factory';

describe('RefreshCookieFactory', () => {
  function buildFactory(isProduction: boolean) {
    const values: Record<string, unknown> = {
      'app.isProduction': isProduction,
      'cookie.name': 'refresh_token',
      'cookie.path': '/api/v1/auth',
      'jwt.refreshTtlDays': 7,
    };
    const configService = {
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;
    return new RefreshCookieFactory(configService);
  }

  it('uses the plain cookie name outside production', () => {
    expect(buildFactory(false).cookieName).toBe('refresh_token');
  });

  it('prefixes the cookie name with __Secure- in production (ASVS V3.3.1)', () => {
    expect(buildFactory(true).cookieName).toBe('__Secure-refresh_token');
  });
});
