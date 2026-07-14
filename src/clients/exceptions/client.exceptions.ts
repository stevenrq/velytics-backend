import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/exceptions/domain.exception';

/** Thrown when a person client id does not resolve to an existing record. */
export class PersonNotFoundException extends DomainException {
  readonly translationKey = 'clients.errors.PERSON_NOT_FOUND';

  constructor(readonly personId?: number) {
    super(HttpStatus.NOT_FOUND, { personId }, 'Person not found');
  }
}

/** Thrown when a company client id does not resolve to an existing record. */
export class CompanyNotFoundException extends DomainException {
  readonly translationKey = 'clients.errors.COMPANY_NOT_FOUND';

  constructor(readonly companyId?: number) {
    super(HttpStatus.NOT_FOUND, { companyId }, 'Company not found');
  }
}
