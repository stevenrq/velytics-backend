// ASVS 5.0 V6.2.1/V6.2.5: length is the primary control, no forced
// composition rules (upper/lower/digit/symbol requirements are explicitly
// discouraged by ASVS 5.0, since they push users toward predictable
// substitutions instead of longer passphrases).
export const PASSWORD_MIN_LENGTH = 8;
// bcrypt silently truncates input at 72 bytes; anything beyond never
// participates in the hash. Capped at 72 (not a larger number) specifically
// to stay under that boundary rather than adding a SHA-256 pre-hash layer.
export const PASSWORD_MAX_LENGTH = 72;

export const USERNAME_REGEX = /^[a-zA-Z0-9]{6,20}$/;

export {
  NATIONAL_ID_REGEX,
  PHONE_NUMBER_REGEX,
} from '../common/validation.constants';
