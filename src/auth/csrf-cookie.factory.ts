import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import {
  buildAuthCookieOptions,
  withSecurePrefix,
} from './auth-cookie-options.util';

@Injectable()
export class CsrfCookieFactory {
  constructor(private readonly configService: ConfigService) {}

  get cookieName(): string {
    return withSecurePrefix(
      this.configService,
      this.configService.get<string>('cookie.csrfName')!,
    );
  }

  private options(): CookieOptions {
    // Not httpOnly: the whole point of double-submit is that this value is
    // opaque to a cross-site attacker (who can't read *or* set it), not that
    // it's hidden from the legitimate frontend's own JS.
    return buildAuthCookieOptions(this.configService, { httpOnly: false });
  }

  /** Generates a new token, sets it as a cookie, and returns it for the response body. */
  issue(res: Response): string {
    const token = randomBytes(32).toString('base64url');
    const refreshTtlDays = this.configService.get<number>('jwt.refreshTtlDays');
    res.cookie(this.cookieName, token, {
      ...this.options(),
      maxAge: (refreshTtlDays ?? 7) * 24 * 60 * 60 * 1000,
    });
    return token;
  }

  clear(res: Response): void {
    res.clearCookie(this.cookieName, this.options());
  }
}
