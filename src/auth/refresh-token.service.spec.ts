import { PrismaService } from '../prisma/prisma.service';
import { RefreshTokenService } from './refresh-token.service';
import {
  InvalidRefreshTokenException,
  RefreshTokenReuseDetectedException,
} from './exceptions/auth.exceptions';

describe('RefreshTokenService domain exceptions', () => {
  function buildService(existing: unknown) {
    const refreshToken = {
      findUnique: jest.fn().mockResolvedValue(existing),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    };
    const prisma = { refreshToken } as unknown as PrismaService;
    const configService = { get: jest.fn() } as never;

    return {
      service: new RefreshTokenService(prisma, configService),
      refreshToken,
    };
  }

  it('throws InvalidRefreshTokenException when the token hash has no match', async () => {
    const { service } = buildService(null);
    await expect(service.rotate('raw-token')).rejects.toBeInstanceOf(
      InvalidRefreshTokenException,
    );
  });

  it('throws RefreshTokenReuseDetectedException and revokes all sessions when the token was already revoked', async () => {
    const { service, refreshToken } = buildService({
      userId: 7,
      revoked: true,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.rotate('raw-token')).rejects.toMatchObject({
      constructor: RefreshTokenReuseDetectedException,
      userId: 7,
    });
    expect(refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 7, revoked: false },
      data: expect.objectContaining({ revoked: true }),
    });
  });

  it('throws RefreshTokenReuseDetectedException when the token is expired', async () => {
    const { service } = buildService({
      userId: 3,
      revoked: false,
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(service.rotate('raw-token')).rejects.toBeInstanceOf(
      RefreshTokenReuseDetectedException,
    );
  });

  it('revokeAllForUser revokes every active refresh token for that user', async () => {
    const { service, refreshToken } = buildService(null);

    await service.revokeAllForUser(42);

    expect(refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 42, revoked: false },
      data: { revoked: true, revokedAt: expect.any(Date) },
    });
  });
});
