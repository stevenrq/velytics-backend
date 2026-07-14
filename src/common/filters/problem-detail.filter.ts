import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { I18nContext, I18nService, I18nValidationException } from 'nestjs-i18n';
import type { ValidationError } from 'class-validator';
import type { Request, Response } from 'express';

interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  errors?: Record<string, string>;
}

interface ResolvedProblem {
  status: number;
  detail: string;
  errors?: Record<string, string>;
}

/**
 * Shape of the object `@prisma/driver-adapter-utils`' `DriverAdapterError`
 * carries as `cause`. Duck-typed instead of imported: the package is only a
 * transitive dependency (via `@prisma/adapter-pg`), not one of ours.
 */
interface DriverAdapterErrorLike extends Error {
  name: 'DriverAdapterError';
  cause: {
    kind: string;
    constraint?:
      { fields: string[] } | { index: string } | { foreignKey: object };
    /** Only present when `kind` is the generic `'postgres'` fallback. */
    code?: string;
  };
}

/**
 * Postgres SQLSTATE for `restrict_violation` — raised for `onDelete: Restrict`
 * relations (as opposed to `23503 foreign_key_violation`, which
 * `@prisma/adapter-pg` already maps to `kind: 'ForeignKeyConstraintViolation'`).
 * `@prisma/adapter-pg@7.8.0` doesn't map this code, so it falls through to the
 * generic `kind: 'postgres'` shape and must be matched by `code` instead.
 */
const PG_RESTRICT_VIOLATION = '23001';

/**
 * Global RFC-7807 (`application/problem+json`) exception filter.
 *
 * This is the single seat where translation keys become localized responses:
 * services throw {@link DomainException}s carrying a key, and the pipe throws
 * {@link I18nValidationException}s with already-translated constraints — this
 * filter is the only component that touches {@link I18nService}.
 */
@Catch()
export class ProblemDetailFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailFilter.name);

  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const lang = I18nContext.current(host)?.lang ?? 'es';

    const { status, detail, errors } = this.resolve(exception, lang);

    const problem: ProblemDetail = {
      type: 'about:blank',
      title: this.translateTitle(status, lang),
      status,
      detail,
      instance: request.url,
      ...(errors ? { errors } : {}),
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}: ${detail}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response
      .status(status)
      .contentType('application/problem+json')
      .send(problem);
  }

  private resolve(exception: unknown, lang: string): ResolvedProblem {
    // Validation runs first: I18nValidationException also extends HttpException,
    // so it must be matched before the generic HttpException branch below.
    if (exception instanceof I18nValidationException) {
      return {
        status: exception.getStatus(),
        detail: this.t('common.errors.VALIDATION_FAILED', lang),
        errors: this.toFieldErrorMap(exception.errors),
      };
    }

    if (this.isDomainException(exception)) {
      return {
        status: exception.getStatus(),
        detail: this.t(
          exception.translationKey,
          lang,
          exception.translationArgs,
        ),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'object' && body !== null) {
        const message = (body as Record<string, unknown>).message;
        return {
          status,
          detail: Array.isArray(message)
            ? message.join(', ')
            : ((message as string) ?? exception.message),
        };
      }
      return { status, detail: exception.message };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.resolvePrismaError(exception, lang);
    }

    if (this.isDriverAdapterError(exception)) {
      return this.resolveDriverAdapterError(exception, lang);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: this.t('common.errors.INTERNAL', lang),
    };
  }

  private resolvePrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
    lang: string,
  ): ResolvedProblem {
    switch (exception.code) {
      case 'P2002': {
        const fields = (exception.meta?.target as string[] | undefined)?.join(
          ', ',
        );
        return {
          status: HttpStatus.CONFLICT,
          detail: fields
            ? this.t('common.errors.DB_UNIQUE_VIOLATION', lang, { fields })
            : this.t('common.errors.DB_UNIQUE_VIOLATION_GENERIC', lang),
        };
      }
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          detail: this.t('common.errors.DB_NOT_FOUND', lang),
        };
      case 'P2003':
        return {
          status: HttpStatus.CONFLICT,
          detail: this.t('common.errors.DB_FK_VIOLATION', lang),
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detail: this.t('common.errors.DB_UNKNOWN', lang),
        };
    }
  }

  /**
   * With the Prisma 7 driver-adapter client, constraint violations raised
   * from raw driver calls (e.g. a RESTRICT-ed FK hit during `.delete()`)
   * surface as this error instead of being wrapped into a
   * {@link Prisma.PrismaClientKnownRequestError}. Map the ones with a
   * PrismaClientKnownRequestError equivalent the same way {@link resolvePrismaError}
   * does; everything else falls back to the generic 500, same as an
   * unmapped Prisma error code.
   */
  private resolveDriverAdapterError(
    exception: DriverAdapterErrorLike,
    lang: string,
  ): ResolvedProblem {
    switch (exception.cause.kind) {
      case 'UniqueConstraintViolation': {
        const fields = this.driverErrorFields(exception.cause.constraint);
        return {
          status: HttpStatus.CONFLICT,
          detail: fields
            ? this.t('common.errors.DB_UNIQUE_VIOLATION', lang, {
                fields: fields.join(', '),
              })
            : this.t('common.errors.DB_UNIQUE_VIOLATION_GENERIC', lang),
        };
      }
      case 'ForeignKeyConstraintViolation':
        return {
          status: HttpStatus.CONFLICT,
          detail: this.t('common.errors.DB_FK_VIOLATION', lang),
        };
      case 'postgres':
        if (exception.cause.code === PG_RESTRICT_VIOLATION) {
          return {
            status: HttpStatus.CONFLICT,
            detail: this.t('common.errors.DB_FK_VIOLATION', lang),
          };
        }
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detail: this.t('common.errors.DB_UNKNOWN', lang),
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          detail: this.t('common.errors.DB_UNKNOWN', lang),
        };
    }
  }

  private driverErrorFields(
    constraint: DriverAdapterErrorLike['cause']['constraint'],
  ): string[] | undefined {
    return constraint && 'fields' in constraint ? constraint.fields : undefined;
  }

  private isDriverAdapterError(
    exception: unknown,
  ): exception is DriverAdapterErrorLike {
    return (
      exception instanceof Error &&
      exception.name === 'DriverAdapterError' &&
      typeof (exception as { cause?: unknown }).cause === 'object' &&
      (exception as { cause?: unknown }).cause !== null
    );
  }

  /** Type guard that avoids a runtime import cycle with the exceptions module. */
  private isDomainException(exception: unknown): exception is HttpException & {
    translationKey: string;
    translationArgs: Record<string, unknown>;
  } {
    return (
      exception instanceof HttpException &&
      typeof (exception as { translationKey?: unknown }).translationKey ===
        'string'
    );
  }

  private translateTitle(status: number, lang: string): string {
    const key = `common.errors.titles.${status}`;
    const title = this.t(key, lang);
    // I18nService returns the key path verbatim when it is missing; fall back
    // to the generic title so unmapped statuses never leak a raw key.
    return title === key ? this.t('common.errors.titles.default', lang) : title;
  }

  /**
   * Flattens already-translated validation constraints into field -> message,
   * recursing into @ValidateNested() children (e.g. address.city,
   * vehicleData.motorNumber) since a nested DTO's own top-level entry often
   * carries no constraints itself — only its children do.
   */
  private toFieldErrorMap(
    errors: ValidationError[],
    parentPath = '',
  ): Record<string, string> {
    const map: Record<string, string> = {};
    for (const error of errors) {
      const path = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;
      const messages = Object.values(error.constraints ?? {});
      if (messages.length > 0) {
        map[path] = messages[0];
      }
      if (error.children && error.children.length > 0) {
        Object.assign(map, this.toFieldErrorMap(error.children, path));
      }
    }
    return map;
  }

  private t(key: string, lang: string, args?: Record<string, unknown>): string {
    return this.i18n.translate(key, { lang, args });
  }
}
