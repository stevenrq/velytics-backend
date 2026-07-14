import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS_KEY } from '../../common/decorators/require-permissions.decorator';
import { ALLOW_SELF_KEY } from '../../common/decorators/allow-self.decorator';
import { InsufficientPermissionsException } from '../exceptions/auth.exceptions';
import type { RequestUser } from '../types/request-user.type';

describe('PermissionsGuard domain exceptions', () => {
  function buildGuard(
    requiredPermissions: string[] | undefined,
    allowSelfParam?: string,
  ) {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === PERMISSIONS_KEY) return requiredPermissions;
        if (key === ALLOW_SELF_KEY) return allowSelfParam;
        return undefined;
      }),
    } as unknown as Reflector;
    return new PermissionsGuard(reflector);
  }

  function fakeContext(
    user?: RequestUser,
    params: Record<string, string> = {},
  ) {
    const request = { user, params } as unknown as Request;
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  it('throws InsufficientPermissionsException when there is no authenticated user', () => {
    const guard = buildGuard(['user:read']);
    expect(() => guard.canActivate(fakeContext(undefined))).toThrow(
      InsufficientPermissionsException,
    );
  });

  it('throws InsufficientPermissionsException when the user lacks the required authority', () => {
    const guard = buildGuard(['user:read']);
    const user: RequestUser = {
      id: 1,
      username: 'x',
      authorities: ['role:read'],
    };
    expect(() => guard.canActivate(fakeContext(user))).toThrow(
      InsufficientPermissionsException,
    );
  });

  it('allows access via AllowSelf even without the required authority', () => {
    const guard = buildGuard(['user:update'], 'id');
    const user: RequestUser = { id: 42, username: 'x', authorities: [] };
    expect(guard.canActivate(fakeContext(user, { id: '42' }))).toBe(true);
  });
});
