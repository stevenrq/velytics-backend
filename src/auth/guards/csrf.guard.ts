import { createHash, timingSafeEqual } from 'node:crypto';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { REQUIRE_CSRF_KEY } from '../../common/decorators/require-csrf.decorator';
import { CsrfCookieFactory } from '../csrf-cookie.factory';
import {
  CsrfTokenMismatchException,
  MissingCsrfTokenException,
} from '../exceptions/auth.exceptions';

/**
 * Double-submit CSRF check for routes that rely on cookies for auth
 * (/auth/refresh is @Public() and bypasses JwtAuthGuard entirely, so it has
 * no other cross-site protection). The frontend and backend are on
 * different registrable domains in production, so SameSite alone cannot
 * mitigate this — the csrf cookie is not httpOnly specifically so the
 * frontend's own JS can read it and echo it back as a header.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly csrfCookieFactory: CsrfCookieFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_CSRF_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const cookieToken = request.cookies?.[this.csrfCookieFactory.cookieName] as
      string | undefined;
    const headerToken = request.headers['x-csrf-token'];

    if (
      typeof cookieToken !== 'string' ||
      !cookieToken ||
      typeof headerToken !== 'string' ||
      !headerToken
    ) {
      throw new MissingCsrfTokenException();
    }

    const cookieHash = createHash('sha256').update(cookieToken).digest();
    const headerHash = createHash('sha256').update(headerToken).digest();
    if (!timingSafeEqual(cookieHash, headerHash)) {
      throw new CsrfTokenMismatchException();
    }
    return true;
  }
}
