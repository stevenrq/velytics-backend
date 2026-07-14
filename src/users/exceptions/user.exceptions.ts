import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/exceptions/domain.exception';

/** Thrown when a user id does not resolve to an existing record. */
export class UserNotFoundException extends DomainException {
  readonly translationKey = 'users.errors.NOT_FOUND';

  constructor(readonly userId?: number) {
    super(HttpStatus.NOT_FOUND, { userId }, 'User not found');
  }
}

/** Thrown when a caller edits roles without the `user:update` authority. */
export class RoleUpdateForbiddenException extends DomainException {
  readonly translationKey = 'users.errors.ROLE_UPDATE_FORBIDDEN';

  constructor() {
    super(HttpStatus.FORBIDDEN, {}, 'Role update forbidden');
  }
}

/** Thrown when a caller toggles `enabled` via the general update endpoint. */
export class StatusChangeForbiddenException extends DomainException {
  readonly translationKey = 'users.errors.STATUS_CHANGE_FORBIDDEN';

  constructor() {
    super(HttpStatus.FORBIDDEN, {}, 'Status change forbidden');
  }
}

/** Thrown when requested role names have no matching role records. */
export class UnknownRolesException extends DomainException {
  readonly translationKey = 'users.errors.UNKNOWN_ROLES';

  constructor(roles: string[]) {
    // Pre-joined here so the translation stays a plain `{roles}` placeholder.
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      { roles: roles.join(', ') },
      'Unknown roles',
    );
  }
}

/** Thrown when a new password matches a known public breach corpus (ASVS V6.2.4). */
export class BreachedPasswordException extends DomainException {
  readonly translationKey = 'users.errors.BREACHED_PASSWORD';

  constructor() {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      {},
      'Password found in a public breach corpus',
    );
  }
}

/** Thrown when a user changes their own password without providing the current one (ASVS V6.2.3). */
export class CurrentPasswordRequiredException extends DomainException {
  readonly translationKey = 'users.errors.CURRENT_PASSWORD_REQUIRED';

  constructor() {
    super(HttpStatus.BAD_REQUEST, {}, 'Current password is required');
  }
}

/** Thrown when the current password provided for a self-service change does not match. */
export class CurrentPasswordInvalidException extends DomainException {
  readonly translationKey = 'users.errors.CURRENT_PASSWORD_INVALID';

  constructor() {
    super(HttpStatus.UNAUTHORIZED, {}, 'Current password is incorrect');
  }
}
