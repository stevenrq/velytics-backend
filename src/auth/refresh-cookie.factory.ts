import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import {
  buildAuthCookieOptions,
  withSecurePrefix,
} from './auth-cookie-options.util';

@Injectable()
export class RefreshCookieFactory {
  constructor(private readonly configService: ConfigService) {}

  get cookieName(): string {
    return withSecurePrefix(
      this.configService,
      this.configService.get<string>('cookie.name')!,
    );
  }

  private options(): CookieOptions {
    return buildAuthCookieOptions(this.configService, { httpOnly: true });
  }

  set(res: Response, rawRefreshToken: string): void {
    const refreshTtlDays = this.configService.get<number>('jwt.refreshTtlDays');
    res.cookie(this.cookieName, rawRefreshToken, {
      ...this.options(),
      maxAge: (refreshTtlDays ?? 7) * 24 * 60 * 60 * 1000,
    });
  }

  clear(res: Response): void {
    res.clearCookie(this.cookieName, this.options());
  }
}
