import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import type { JwtTokenService } from './jwt-token.service';
import type { RefreshTokenService } from './refresh-token.service';
import type { TokenDenylistService } from './token-denylist.service';
import { InvalidCredentialsException } from './exceptions/auth.exceptions';

describe('AuthService domain exceptions', () => {
  function buildService(
    user: unknown,
    refreshTokenServiceOverrides: Record<string, unknown> = {},
  ) {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
        findUniqueOrThrow: jest.fn().mockResolvedValue(user),
      },
    } as unknown as PrismaService;
    const refreshTokenService = {
      rotate: jest.fn(),
      revokeAllForUser: jest.fn().mockResolvedValue(undefined),
      ...refreshTokenServiceOverrides,
    } as unknown as RefreshTokenService;

    return {
      service: new AuthService(
        prisma,
        {} as JwtTokenService,
        refreshTokenService,
        {} as TokenDenylistService,
      ),
      refreshTokenService,
    };
  }

  it('throws InvalidCredentialsException when the username does not exist', async () => {
    const { service } = buildService(null);
    await expect(service.login('ghost', 'x')).rejects.toBeInstanceOf(
      InvalidCredentialsException,
    );
  });

  it('throws InvalidCredentialsException when the user is disabled', async () => {
    const { service } = buildService({ enabled: false, password: 'hash' });
    await expect(service.login('admin', 'x')).rejects.toBeInstanceOf(
      InvalidCredentialsException,
    );
  });

  it('throws InvalidCredentialsException when the password does not match', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    const { service } = buildService({
      enabled: true,
      password: passwordHash,
    });
    await expect(
      service.login('admin', 'wrong-password'),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);
  });

  it('throws InvalidCredentialsException and revokes sessions when refreshing for a disabled user', async () => {
    const revokeAllForUser = jest.fn().mockResolvedValue(undefined);
    const { service } = buildService(
      { id: 9, enabled: false, roles: [] },
      {
        rotate: jest
          .fn()
          .mockResolvedValue({ userId: 9, rawToken: 'successor' }),
        revokeAllForUser,
      },
    );

    await expect(service.refresh('raw-token')).rejects.toBeInstanceOf(
      InvalidCredentialsException,
    );
    expect(revokeAllForUser).toHaveBeenCalledWith(9);
  });
});
