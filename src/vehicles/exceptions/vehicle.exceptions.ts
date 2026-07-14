import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/exceptions/domain.exception';

/** Thrown when a car vehicle id does not resolve to an existing record. */
export class CarNotFoundException extends DomainException {
  readonly translationKey = 'vehicles.errors.CAR_NOT_FOUND';

  constructor(readonly carId?: number) {
    super(HttpStatus.NOT_FOUND, { carId }, 'Car not found');
  }
}

/** Thrown when a motorcycle vehicle id does not resolve to an existing record. */
export class MotorcycleNotFoundException extends DomainException {
  readonly translationKey = 'vehicles.errors.MOTORCYCLE_NOT_FOUND';

  constructor(readonly motorcycleId?: number) {
    super(HttpStatus.NOT_FOUND, { motorcycleId }, 'Motorcycle not found');
  }
}
