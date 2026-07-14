import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/exceptions/domain.exception';

/** Thrown when a protected route is called without a Bearer token. */
export class AccessTokenRequiredException extends DomainException {
  readonly translationKey = 'auth.errors.ACCESS_TOKEN_REQUIRED';

  constructor() {
    super(HttpStatus.UNAUTHORIZED, {}, 'Access token required');
  }
}

/** Thrown when the presented access token fails verification or has expired. */
export class AccessTokenInvalidException extends DomainException {
  readonly translationKey = 'auth.errors.ACCESS_TOKEN_INVALID';

  constructor() {
    super(HttpStatus.UNAUTHORIZED, {}, 'Access token is invalid or expired');
  }
}

/** Thrown when the presented access token's jti is on the denylist. */
export class AccessTokenRevokedException extends DomainException {
  readonly translationKey = 'auth.errors.ACCESS_TOKEN_REVOKED';

  constructor() {
    super(HttpStatus.UNAUTHORIZED, {}, 'Access token was revoked');
  }
}

/** Thrown when the caller lacks the permissions required for the route. */
export class InsufficientPermissionsException extends DomainException {
  readonly translationKey = 'auth.errors.INSUFFICIENT_PERMISSIONS';

  constructor() {
    super(HttpStatus.FORBIDDEN, {}, 'Insufficient permissions');
  }
}

/** Thrown on login when the username/password pair does not match. */
export class InvalidCredentialsException extends DomainException {
  readonly translationKey = 'auth.errors.INVALID_CREDENTIALS';

  constructor() {
    super(HttpStatus.UNAUTHORIZED, {}, 'Invalid credentials');
  }
}

/** Thrown when the presented refresh token hash has no matching record. */
export class InvalidRefreshTokenException extends DomainException {
  readonly translationKey = 'auth.errors.INVALID_REFRESH_TOKEN';

  constructor() {
    super(HttpStatus.UNAUTHORIZED, {}, 'Invalid refresh token');
  }
}

/**
 * Thrown when a refresh token is presented after already being revoked or
 * expired — treated as token theft/reuse, so all of the user's sessions are
 * revoked before this is thrown.
 */
export class RefreshTokenReuseDetectedException extends DomainException {
  readonly translationKey = 'auth.errors.REFRESH_TOKEN_REUSE_DETECTED';

  constructor(readonly userId?: number) {
    super(HttpStatus.UNAUTHORIZED, { userId }, 'Refresh token reuse detected');
  }
}

/** Thrown when the refresh_token httpOnly cookie is missing from the request. */
export class MissingRefreshCookieException extends DomainException {
  readonly translationKey = 'auth.errors.MISSING_REFRESH_COOKIE';

  constructor() {
    super(HttpStatus.UNAUTHORIZED, {}, 'Missing refresh cookie');
  }
}

/** Thrown when a CSRF-protected route is called without the cookie/header pair. */
export class MissingCsrfTokenException extends DomainException {
  readonly translationKey = 'auth.errors.MISSING_CSRF_TOKEN';

  constructor() {
    super(HttpStatus.FORBIDDEN, {}, 'Missing CSRF token');
  }
}

/** Thrown when the X-CSRF-Token header does not match the csrf cookie (double-submit). */
export class CsrfTokenMismatchException extends DomainException {
  readonly translationKey = 'auth.errors.CSRF_TOKEN_MISMATCH';

  constructor() {
    super(HttpStatus.FORBIDDEN, {}, 'CSRF token mismatch');
  }
}
