import { SetMetadata } from '@nestjs/common';

export const ALLOW_SERVICE_KEY = 'allowServiceKey';

/**
 * Lets a request authenticate with the X-Service-Key header (constant-time
 * compared against SERVICE_API_KEY) as an alternative to a user JWT.
 * Used by the external ML service to pull read-only data.
 */
export const AllowServiceKey = () => SetMetadata(ALLOW_SERVICE_KEY, true);
