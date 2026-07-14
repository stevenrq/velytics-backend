import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { JwtTokenService } from '../jwt-token.service';
import type { TokenDenylistService } from '../token-denylist.service';
import {
  AccessTokenInvalidException,
  AccessTokenRequiredException,
  AccessTokenRevokedException,
} from '../exceptions/auth.exceptions';

/**
 * Mirrors the other modules' decoupling tests: asserts the thrown domain
 * exception types without ever touching I18nService.
 */
describe('JwtAuthGuard domain exceptions', () => {
  function fakeContext(headers: Record<string, string> = {}): ExecutionContext {
    const request = { headers, params: {} } as unknown as Request;
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  function buildGuard(overrides?: {
    verify?: jest.Mock;
    isDenylisted?: jest.Mock;
  }) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const jwtTokenService = {
      verify: overrides?.verify ?? jest.fn().mockResolvedValue({ jti: 'x' }),
    } as unknown as JwtTokenService;
    const denylistService = {
      isDenylisted:
        overrides?.isDenylisted ?? jest.fn().mockResolvedValue(false),
    } as unknown as TokenDenylistService;
    const configService = { get: jest.fn() } as never;

    return new JwtAuthGuard(
      reflector,
      jwtTokenService,
      denylistService,
      configService,
    );
  }

  it('throws AccessTokenRequiredException when no Authorization header is sent', async () => {
    const guard = buildGuard();
    await expect(guard.canActivate(fakeContext())).rejects.toBeInstanceOf(
      AccessTokenRequiredException,
    );
  });

  it('throws AccessTokenInvalidException when verification fails', async () => {
    const guard = buildGuard({
      verify: jest.fn().mockRejectedValue(new Error('bad token')),
    });
    await expect(
      guard.canActivate(fakeContext({ authorization: 'Bearer token' })),
    ).rejects.toBeInstanceOf(AccessTokenInvalidException);
  });

  it('throws AccessTokenRevokedException when the jti is denylisted', async () => {
    const guard = buildGuard({
      isDenylisted: jest.fn().mockResolvedValue(true),
    });
    await expect(
      guard.canActivate(fakeContext({ authorization: 'Bearer token' })),
    ).rejects.toBeInstanceOf(AccessTokenRevokedException);
  });
});
