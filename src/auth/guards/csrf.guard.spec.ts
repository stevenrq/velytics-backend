import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { CsrfGuard } from './csrf.guard';
import type { CsrfCookieFactory } from '../csrf-cookie.factory';
import {
  CsrfTokenMismatchException,
  MissingCsrfTokenException,
} from '../exceptions/auth.exceptions';

describe('CsrfGuard', () => {
  function fakeContext(
    cookies: Record<string, string> = {},
    headers: Record<string, string> = {},
  ): ExecutionContext {
    const request = { cookies, headers } as unknown as Request;
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  function buildGuard(required: boolean | undefined) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(required),
    } as unknown as Reflector;
    const csrfCookieFactory = {
      cookieName: 'csrf_token',
    } as unknown as CsrfCookieFactory;
    return new CsrfGuard(reflector, csrfCookieFactory);
  }

  it('allows the request through when @RequireCsrf() is not set', () => {
    const guard = buildGuard(undefined);
    expect(guard.canActivate(fakeContext())).toBe(true);
  });

  it('throws MissingCsrfTokenException when the cookie is missing', () => {
    const guard = buildGuard(true);
    expect(() =>
      guard.canActivate(fakeContext({}, { 'x-csrf-token': 'abc' })),
    ).toThrow(MissingCsrfTokenException);
  });

  it('throws MissingCsrfTokenException when the header is missing', () => {
    const guard = buildGuard(true);
    expect(() => guard.canActivate(fakeContext({ csrf_token: 'abc' }))).toThrow(
      MissingCsrfTokenException,
    );
  });

  it('throws CsrfTokenMismatchException when cookie and header differ', () => {
    const guard = buildGuard(true);
    expect(() =>
      guard.canActivate(
        fakeContext({ csrf_token: 'abc' }, { 'x-csrf-token': 'def' }),
      ),
    ).toThrow(CsrfTokenMismatchException);
  });

  it('allows the request through when cookie and header match', () => {
    const guard = buildGuard(true);
    expect(
      guard.canActivate(
        fakeContext({ csrf_token: 'abc' }, { 'x-csrf-token': 'abc' }),
      ),
    ).toBe(true);
  });
});
