import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

/**
 * Thrown when a relation-replace update (e.g. a role's permission set, a
 * user's role set) targets a record whose `updatedAt` no longer matches what
 * the caller last read — someone else modified it in the meantime.
 */
export class ConcurrentModificationException extends DomainException {
  readonly translationKey = 'common.errors.CONCURRENT_MODIFICATION';

  constructor() {
    super(HttpStatus.CONFLICT, {}, 'Concurrent modification');
  }
}
