import { HttpException } from '@nestjs/common';

/**
 * Base class for typed domain exceptions.
 *
 * Services throw these instead of touching I18nService, so they stay decoupled
 * from i18n and are trivial to unit-test (assert the type/key, no mock needed).
 * The global {@link ProblemDetailFilter} reads {@link translationKey} and
 * {@link translationArgs} to build the localized HTTP response.
 */
export abstract class DomainException extends HttpException {
  /** i18n key resolved by the filter, e.g. `users.errors.NOT_FOUND`. */
  abstract readonly translationKey: string;

  protected constructor(
    status: number,
    /** Interpolation values forwarded to the translation, e.g. `{ roles }`. */
    readonly translationArgs: Record<string, unknown> = {},
    /** English text kept for logs and `super.message`; never shown to clients. */
    fallbackMessage = 'Domain error',
  ) {
    super(fallbackMessage, status);
  }
}
