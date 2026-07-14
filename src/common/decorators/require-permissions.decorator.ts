import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Grants access if the caller's JWT authorities include ANY of the given
 * permissions (recurso:accion). Combine with @AllowSelf() to also allow
 * the resource owner regardless of permissions.
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
