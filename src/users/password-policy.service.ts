import { Injectable, Logger } from '@nestjs/common';
import { pwnedPassword } from 'hibp';
import { BreachedPasswordException } from './exceptions/user.exceptions';

const PWNED_API_TIMEOUT_MS = 1500;

/**
 * ASVS V6.2.4: rejects passwords found in a public breach corpus. Uses
 * k-anonymity (only a 5-char SHA-1 prefix ever leaves the process, never the
 * plaintext password). Fails open on timeout/outage — this is defense in
 * depth, not the primary control, so a third-party outage must not block
 * registration or password changes.
 */
@Injectable()
export class PasswordPolicyService {
  private readonly logger = new Logger(PasswordPolicyService.name);

  async assertNotBreached(password: string): Promise<void> {
    let timesSeen: number;
    try {
      timesSeen = await pwnedPassword(password, {
        timeoutMs: PWNED_API_TIMEOUT_MS,
      });
    } catch (err) {
      this.logger.warn(
        'Pwned Passwords check unavailable; allowing password through',
        { error: (err as Error).message },
      );
      return;
    }
    if (timesSeen > 0) {
      throw new BreachedPasswordException();
    }
  }
}
