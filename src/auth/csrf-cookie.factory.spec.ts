import type { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { CsrfCookieFactory } from './csrf-cookie.factory';

describe('CsrfCookieFactory', () => {
  function buildFactory(isProduction: boolean) {
    const values: Record<string, unknown> = {
      'app.isProduction': isProduction,
      'cookie.csrfName': 'csrf_token',
      'cookie.path': '/api/v1/auth',
      'jwt.refreshTtlDays': 7,
    };
    const configService = {
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;
    return new CsrfCookieFactory(configService);
  }

  it('uses the plain cookie name outside production', () => {
    expect(buildFactory(false).cookieName).toBe('csrf_token');
  });

  it('prefixes the cookie name with __Secure- in production (ASVS V3.3.1)', () => {
    expect(buildFactory(true).cookieName).toBe('__Secure-csrf_token');
  });

  it('issue() sets a non-httpOnly cookie and returns the same token', () => {
    const factory = buildFactory(false);
    const cookie = jest.fn();
    const res = { cookie } as unknown as Response;

    const token = factory.issue(res);

    expect(token).toEqual(expect.any(String));
    expect(cookie).toHaveBeenCalledWith(
      'csrf_token',
      token,
      expect.objectContaining({ httpOnly: false }),
    );
  });
});
