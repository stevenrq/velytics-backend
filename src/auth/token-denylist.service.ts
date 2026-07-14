import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

/**
 * In-memory denylist of revoked access-token jti's, so logout takes effect
 * immediately despite JWTs being stateless. Single-instance only — swap the
 * cache-manager store for a Redis/Keyv backend before scaling horizontally.
 */
@Injectable()
export class TokenDenylistService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  private key(jti: string): string {
    return `denylist:${jti}`;
  }

  async denylist(jti: string, expiresAt: Date): Promise<void> {
    const ttlMs = Math.max(0, expiresAt.getTime() - Date.now());
    await this.cache.set(this.key(jti), true, ttlMs);
  }

  async isDenylisted(jti: string): Promise<boolean> {
    return Boolean(await this.cache.get(this.key(jti)));
  }
}
