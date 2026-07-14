import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/exceptions/domain.exception';

/** Thrown when a role id does not resolve to an existing record. */
export class RoleNotFoundException extends DomainException {
  readonly translationKey = 'roles.errors.NOT_FOUND';

  constructor(readonly roleId?: number) {
    super(HttpStatus.NOT_FOUND, { roleId }, 'Role not found');
  }
}

/** Thrown when requested permission names have no matching catalog entries. */
export class UnknownPermissionsException extends DomainException {
  readonly translationKey = 'roles.errors.UNKNOWN_PERMISSIONS';

  constructor(permissions: string[]) {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      { permissions: permissions.join(', ') },
      'Unknown permissions',
    );
  }
}
