import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/exceptions/domain.exception';

/** Thrown when the requested report format is not one of pdf/excel/csv. */
export class InvalidReportFormatException extends DomainException {
  readonly translationKey = 'reports.errors.INVALID_FORMAT';

  constructor(readonly format?: string) {
    super(HttpStatus.BAD_REQUEST, { format }, 'Invalid report format');
  }
}
