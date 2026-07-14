import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePurchaseSaleDto } from './create-purchase-sale.dto';

export class UpdatePurchaseSaleDto extends PartialType(
  OmitType(CreatePurchaseSaleDto, ['vehicleData'] as const),
) {}
