import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../common/exceptions/domain.exception';

/** Thrown when the referenced vehicle id does not exist. */
export class VehicleNotFoundException extends DomainException {
  readonly translationKey = 'vehicle-images.errors.VEHICLE_NOT_FOUND';

  constructor(readonly vehicleId?: number) {
    super(HttpStatus.NOT_FOUND, { vehicleId }, 'Vehicle not found');
  }
}

/** Thrown when a vehicle image id does not resolve to an existing record. */
export class VehicleImageNotFoundException extends DomainException {
  readonly translationKey = 'vehicle-images.errors.IMAGE_NOT_FOUND';

  constructor(readonly imageId?: number) {
    super(HttpStatus.NOT_FOUND, { imageId }, 'Vehicle image not found');
  }
}

/** Thrown when the confirmed S3 key does not belong to the target vehicle. */
export class KeyMismatchException extends DomainException {
  readonly translationKey = 'vehicle-images.errors.KEY_MISMATCH';

  constructor() {
    super(HttpStatus.BAD_REQUEST, {}, 'S3 key does not match the vehicle');
  }
}

/** Thrown when the confirmed key has no matching object in S3. */
export class UploadedObjectNotFoundException extends DomainException {
  readonly translationKey = 'vehicle-images.errors.UPLOADED_OBJECT_NOT_FOUND';

  constructor() {
    super(HttpStatus.BAD_REQUEST, {}, 'Uploaded S3 object not found');
  }
}

/** Thrown when the confirmed content-type does not match the uploaded object. */
export class ContentTypeMismatchException extends DomainException {
  readonly translationKey = 'vehicle-images.errors.CONTENT_TYPE_MISMATCH';

  constructor() {
    super(HttpStatus.BAD_REQUEST, {}, 'Content-type does not match');
  }
}

/** Thrown when the confirmed size does not match the uploaded object. */
export class SizeMismatchException extends DomainException {
  readonly translationKey = 'vehicle-images.errors.SIZE_MISMATCH';

  constructor() {
    super(HttpStatus.BAD_REQUEST, {}, 'Size does not match');
  }
}

/** Thrown when an image with the same key or file name is already registered. */
export class DuplicateImageException extends DomainException {
  readonly translationKey = 'vehicle-images.errors.DUPLICATE_IMAGE';

  constructor() {
    super(HttpStatus.CONFLICT, {}, 'Duplicate image key or file name');
  }
}
