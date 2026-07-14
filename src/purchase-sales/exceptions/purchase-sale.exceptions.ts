import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/exceptions/domain.exception';

/** Thrown when a purchase-sale contract id does not resolve to an existing record. */
export class PurchaseSaleNotFoundException extends DomainException {
  readonly translationKey = 'purchase-sales.errors.NOT_FOUND';

  constructor(readonly purchaseSaleId?: number) {
    super(HttpStatus.NOT_FOUND, { purchaseSaleId }, 'Purchase sale not found');
  }
}

/** Thrown when an update tries to change a contract's immutable type. */
export class ContractTypeImmutableException extends DomainException {
  readonly translationKey = 'purchase-sales.errors.CONTRACT_TYPE_IMMUTABLE';

  constructor() {
    super(HttpStatus.UNPROCESSABLE_ENTITY, {}, 'Contract type is immutable');
  }
}

/** Thrown when deleting a contract that is not in CANCELED status. */
export class DeleteRequiresCanceledStatusException extends DomainException {
  readonly translationKey = 'purchase-sales.errors.DELETE_REQUIRES_CANCELED';

  constructor() {
    super(HttpStatus.CONFLICT, {}, 'Delete requires CANCELED status');
  }
}

/** Thrown when a create request sends both vehicleId and vehicleData. */
export class VehicleIdAndDataConflictException extends DomainException {
  readonly translationKey =
    'purchase-sales.errors.VEHICLE_ID_AND_DATA_CONFLICT';

  constructor() {
    super(
      HttpStatus.BAD_REQUEST,
      {},
      'vehicleId and vehicleData both provided',
    );
  }
}

/** Thrown when a PURCHASE create request sends neither vehicleId nor vehicleData. */
export class VehicleRequiredForPurchaseException extends DomainException {
  readonly translationKey =
    'purchase-sales.errors.VEHICLE_REQUIRED_FOR_PURCHASE';

  constructor() {
    super(
      HttpStatus.BAD_REQUEST,
      {},
      'vehicleId or vehicleData required for a purchase',
    );
  }
}

/** Thrown when vehicleData is sent for a SALE contract. */
export class VehicleDataNotApplicableForSaleException extends DomainException {
  readonly translationKey =
    'purchase-sales.errors.VEHICLE_DATA_NOT_APPLICABLE_FOR_SALE';

  constructor() {
    super(HttpStatus.BAD_REQUEST, {}, 'vehicleData does not apply to a sale');
  }
}

/** Thrown when a SALE contract is missing vehicleId. */
export class VehicleIdRequiredForSaleException extends DomainException {
  readonly translationKey =
    'purchase-sales.errors.VEHICLE_ID_REQUIRED_FOR_SALE';

  constructor() {
    super(HttpStatus.BAD_REQUEST, {}, 'vehicleId is required for a sale');
  }
}

/** Thrown when an embedded vehicle's purchase price is not strictly positive. */
export class VehiclePurchasePriceMustBePositiveException extends DomainException {
  readonly translationKey =
    'purchase-sales.errors.VEHICLE_PURCHASE_PRICE_MUST_BE_POSITIVE';

  constructor() {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      {},
      'Vehicle purchase price must be positive',
    );
  }
}

/** Thrown when a contract references a client id that does not exist. */
export class ClientReferenceNotFoundException extends DomainException {
  readonly translationKey = 'purchase-sales.errors.CLIENT_NOT_FOUND';

  constructor(readonly clientId: number) {
    super(HttpStatus.NOT_FOUND, { clientId }, 'Client reference not found');
  }
}

/** Thrown when a contract references a user id that does not exist. */
export class UserReferenceNotFoundException extends DomainException {
  readonly translationKey = 'purchase-sales.errors.USER_NOT_FOUND';

  constructor(readonly userId: number) {
    super(HttpStatus.NOT_FOUND, { userId }, 'User reference not found');
  }
}

/** Thrown when a contract references a vehicle id that does not exist. */
export class VehicleReferenceNotFoundException extends DomainException {
  readonly translationKey = 'purchase-sales.errors.VEHICLE_NOT_FOUND';

  constructor(readonly vehicleId: number) {
    super(HttpStatus.NOT_FOUND, { vehicleId }, 'Vehicle reference not found');
  }
}

/** Thrown when a PENDING/ACTIVE purchase already exists for the vehicle. */
export class ConflictingPurchaseExistsException extends DomainException {
  readonly translationKey = 'purchase-sales.errors.CONFLICTING_PURCHASE_EXISTS';

  constructor() {
    super(HttpStatus.CONFLICT, {}, 'Conflicting purchase exists for vehicle');
  }
}

/** Thrown when a PURCHASE contract's purchase price is not strictly positive. */
export class PurchasePriceMustBePositiveException extends DomainException {
  readonly translationKey =
    'purchase-sales.errors.PURCHASE_PRICE_MUST_BE_POSITIVE';

  constructor() {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      {},
      'Purchase price must be positive',
    );
  }
}

/** Thrown when a SALE contract has no prior ACTIVE/COMPLETED purchase for the vehicle. */
export class NoValidPurchaseForSaleException extends DomainException {
  readonly translationKey = 'purchase-sales.errors.NO_VALID_PURCHASE_FOR_SALE';

  constructor() {
    super(
      HttpStatus.UNPROCESSABLE_ENTITY,
      {},
      'No valid purchase exists for vehicle',
    );
  }
}

/** Thrown when a SALE contract's sale price is not strictly positive. */
export class SalePriceMustBePositiveException extends DomainException {
  readonly translationKey = 'purchase-sales.errors.SALE_PRICE_MUST_BE_POSITIVE';

  constructor() {
    super(HttpStatus.UNPROCESSABLE_ENTITY, {}, 'Sale price must be positive');
  }
}

/** Thrown when a PENDING/ACTIVE/COMPLETED sale already exists for the vehicle. */
export class ConflictingSaleExistsException extends DomainException {
  readonly translationKey = 'purchase-sales.errors.CONFLICTING_SALE_EXISTS';

  constructor() {
    super(HttpStatus.CONFLICT, {}, 'Conflicting sale exists for vehicle');
  }
}
