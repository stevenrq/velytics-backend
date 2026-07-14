import { SetMetadata } from '@nestjs/common';

export const ALLOW_SELF_KEY = 'allowSelfParam';

/**
 * Also grants access when the route param named `param` equals the
 * authenticated user's id, even without the required permissions.
 */
export const AllowSelf = (param: string = 'id') =>
  SetMetadata(ALLOW_SELF_KEY, param);
