import { HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { RefreshTokenService } from '../auth/refresh-token.service';
import type { RequestUser } from '../auth/types/request-user.type';
import { UsersService } from './users.service';
import type { PasswordPolicyService } from './password-policy.service';
import {
  CurrentPasswordInvalidException,
  CurrentPasswordRequiredException,
  UnknownRolesException,
  UserNotFoundException,
} from './exceptions/user.exceptions';

/**
 * These tests assert the domain-exception contract (type, HTTP status and i18n
 * key) without ever touching I18nService — the whole point of keeping services
 * decoupled from i18n. Translation to Spanish happens later, in the filter.
 */
describe('UsersService domain exceptions', () => {
  function buildService(
    prismaOverrides: Record<string, unknown>,
    refreshTokenServiceOverrides: Record<string, unknown> = {
      revokeAllForUser: jest.fn().mockResolvedValue(undefined),
    },
    passwordPolicyServiceOverrides: Record<string, unknown> = {
      assertNotBreached: jest.fn().mockResolvedValue(undefined),
    },
  ) {
    const prisma = prismaOverrides as unknown as PrismaService;
    const refreshTokenService =
      refreshTokenServiceOverrides as unknown as RefreshTokenService;
    const passwordPolicyService =
      passwordPolicyServiceOverrides as unknown as PasswordPolicyService;
    return new UsersService(prisma, refreshTokenService, passwordPolicyService);
  }

  it('throws UserNotFoundException carrying users.errors.NOT_FOUND when the id is missing', async () => {
    const service = buildService({
      user: { findUnique: jest.fn().mockResolvedValue(null) },
    });

    await expect(service.findOne(999_999)).rejects.toMatchObject({
      constructor: UserNotFoundException,
      translationKey: 'users.errors.NOT_FOUND',
      userId: 999_999,
    });
    await expect(service.findOne(999_999)).rejects.toBeInstanceOf(
      UserNotFoundException,
    );
  });

  it('maps UserNotFoundException to HTTP 404', () => {
    expect(new UserNotFoundException(1).getStatus()).toBe(HttpStatus.NOT_FOUND);
  });

  it('throws UnknownRolesException with the missing role names joined into args', async () => {
    const service = buildService({
      role: {
        findMany: jest.fn().mockResolvedValue([{ id: 1, name: 'USER' }]),
      },
    });

    await expect(
      service.create({
        nationalId: '1020304050',
        firstName: 'Ana',
        lastName: 'Garcia',
        email: 'ana@velytics.com',
        phoneNumber: '3001234567',
        username: 'anagarcia',
        password: 'Admin123!',
        roleNames: ['USER', 'GHOST'],
      }),
    ).rejects.toMatchObject({
      constructor: UnknownRolesException,
      translationKey: 'users.errors.UNKNOWN_ROLES',
      translationArgs: { roles: 'GHOST' },
    });
  });

  it('revokes all refresh tokens when disabling a user', async () => {
    const revokeAllForUser = jest.fn().mockResolvedValue(undefined);
    const service = buildService(
      {
        user: {
          count: jest.fn().mockResolvedValue(1),
          update: jest.fn().mockResolvedValue({ enabled: false }),
        },
      },
      { revokeAllForUser },
    );

    await service.changeStatus(1, false);

    expect(revokeAllForUser).toHaveBeenCalledWith(1);
  });

  it('does not revoke refresh tokens when enabling a user', async () => {
    const revokeAllForUser = jest.fn().mockResolvedValue(undefined);
    const service = buildService(
      {
        user: {
          count: jest.fn().mockResolvedValue(1),
          update: jest.fn().mockResolvedValue({ enabled: true }),
        },
      },
      { revokeAllForUser },
    );

    await service.changeStatus(1, true);

    expect(revokeAllForUser).not.toHaveBeenCalled();
  });

  it('revokes all refresh tokens when removing a user', async () => {
    const revokeAllForUser = jest.fn().mockResolvedValue(undefined);
    const service = buildService(
      {
        user: {
          findUnique: jest.fn().mockResolvedValue({ addressId: null }),
        },
        $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
          cb({
            user: { delete: jest.fn() },
            address: { delete: jest.fn() },
          }),
        ),
      },
      { revokeAllForUser },
    );

    await service.remove(1);

    expect(revokeAllForUser).toHaveBeenCalledWith(1);
  });

  it('checks the new password against the breach corpus on create', async () => {
    const assertNotBreached = jest.fn().mockResolvedValue(undefined);
    const service = buildService(
      {
        role: {
          findMany: jest.fn().mockResolvedValue([{ id: 1, name: 'USER' }]),
        },
        user: {
          create: jest.fn().mockResolvedValue({
            id: 1,
            roles: [],
          }),
        },
      },
      undefined,
      { assertNotBreached },
    );

    await service.create({
      nationalId: '1020304050',
      firstName: 'Ana',
      lastName: 'Garcia',
      email: 'ana@velytics.com',
      phoneNumber: '3001234567',
      username: 'anagarcia',
      password: 'Correct-Horse-Battery',
    });

    expect(assertNotBreached).toHaveBeenCalledWith('Correct-Horse-Battery');
  });

  describe('self-service password change (ASVS V6.2.3)', () => {
    const selfUser: RequestUser = {
      id: 1,
      username: 'self',
      authorities: [],
    };
    const adminUser: RequestUser = {
      id: 2,
      username: 'admin',
      authorities: ['user:update'],
    };

    function buildUpdateService(existingPasswordHash: string) {
      const update = jest.fn().mockResolvedValue({ id: 1, roles: [] });
      const service = buildService({
        user: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ id: 1, password: existingPasswordHash }),
        },
        $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
          cb({ user: { update }, address: { update: jest.fn() } }),
        ),
      });
      return { service, update };
    }

    it('requires currentPassword when a user changes their own password', async () => {
      const { service } = buildUpdateService(
        await bcrypt.hash('OldPassword1', 4),
      );

      await expect(
        service.update(1, { password: 'NewPassword1' }, selfUser),
      ).rejects.toBeInstanceOf(CurrentPasswordRequiredException);
    });

    it('rejects an incorrect currentPassword', async () => {
      const { service } = buildUpdateService(
        await bcrypt.hash('OldPassword1', 4),
      );

      await expect(
        service.update(
          1,
          { password: 'NewPassword1', currentPassword: 'wrong' },
          selfUser,
        ),
      ).rejects.toBeInstanceOf(CurrentPasswordInvalidException);
    });

    it('accepts a correct currentPassword', async () => {
      const { service, update } = buildUpdateService(
        await bcrypt.hash('OldPassword1', 4),
      );

      await service.update(
        1,
        { password: 'NewPassword1', currentPassword: 'OldPassword1' },
        selfUser,
      );

      expect(update).toHaveBeenCalled();
    });

    it('does not require currentPassword when an admin resets another user password', async () => {
      const { service, update } = buildUpdateService(
        await bcrypt.hash('OldPassword1', 4),
      );

      await service.update(1, { password: 'NewPassword1' }, adminUser);

      expect(update).toHaveBeenCalled();
    });
  });
});
