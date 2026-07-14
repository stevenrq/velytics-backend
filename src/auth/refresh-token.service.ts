import { randomBytes, createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  InvalidRefreshTokenException,
  RefreshTokenReuseDetectedException,
} from './exceptions/auth.exceptions';

export interface RotatedRefreshToken {
  userId: number;
  rawToken: string;
}

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private hash(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private newRawToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private expiresAt(): Date {
    const days = this.configService.get<number>('jwt.refreshTtlDays') ?? 7;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  /** Revokes every active refresh token belonging to a user (e.g. on account disable/delete). */
  async revokeAllForUser(userId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });
  }

  async issue(userId: number): Promise<string> {
    const rawToken = this.newRawToken();
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hash(rawToken),
        userId,
        expiresAt: this.expiresAt(),
      },
    });
    return rawToken;
  }

  /**
   * Rotates a refresh token: revokes the presented one and issues a
   * successor. If the presented token is unknown, already revoked, or
   * expired, ALL of the owning user's active refresh tokens are revoked
   * (reuse/theft assumed) before rejecting the request. That mass-revoke
   * runs as its own statement so it survives the 401 thrown afterwards —
   * there is no ambient transaction to roll back in Nest/Prisma.
   */
  async rotate(rawToken: string): Promise<RotatedRefreshToken> {
    const tokenHash = this.hash(rawToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!existing) {
      throw new InvalidRefreshTokenException();
    }

    const isReused = existing.revoked || existing.expiresAt < new Date();
    if (isReused) {
      await this.revokeAllForUser(existing.userId);
      this.logger.error('Refresh token reuse detected; all sessions revoked', {
        key: 'auth.errors.REFRESH_TOKEN_REUSE_DETECTED',
        userId: existing.userId,
      });
      throw new RefreshTokenReuseDetectedException(existing.userId);
    }

    const rawSuccessor = this.newRawToken();
    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revoked: true, revokedAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: {
          tokenHash: this.hash(rawSuccessor),
          userId: existing.userId,
          expiresAt: this.expiresAt(),
        },
      }),
    ]);

    return { userId: existing.userId, rawToken: rawSuccessor };
  }

  async revoke(rawToken: string): Promise<void> {
    const tokenHash = this.hash(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });
  }
}
