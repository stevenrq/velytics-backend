import { Injectable } from '@nestjs/common';
import type { ContractStatus, ContractType } from '@prisma/client';
import {
  ConflictingPurchaseExistsException,
  ConflictingSaleExistsException,
  NoValidPurchaseForSaleException,
  PurchasePriceMustBePositiveException,
  SalePriceMustBePositiveException,
  VehicleIdRequiredForSaleException,
} from './exceptions/purchase-sale.exceptions';

export interface ContractRuleContext {
  contractType: ContractType;
  contractStatus: ContractStatus;
  vehicleId: number | null;
  purchasePrice: number;
  salePrice: number;
  /** Another PURCHASE PENDING/ACTIVE for the same vehicle (excluding self on update). */
  conflictingPurchaseExists: boolean;
  /** Most recent ACTIVE/COMPLETED PURCHASE for the vehicle, if any. */
  latestValidPurchase: { id: number; purchasePrice: number } | null;
  /** Another SALE PENDING/ACTIVE/COMPLETED for the same vehicle (excluding self on update). */
  conflictingSaleExists: boolean;
}

export interface ContractRuleResult {
  purchasePrice: number;
  salePrice: number;
}

/**
 * Pure business-rule engine for purchase/sale contracts. Takes pre-fetched
 * facts (no DB access here) so it can be unit-tested without mocking Prisma.
 */
@Injectable()
export class ContractRulesService {
  apply(context: ContractRuleContext): ContractRuleResult {
    const skipValidation = context.contractStatus === 'CANCELED';
    let { purchasePrice, salePrice } = context;

    if (context.contractType === 'PURCHASE') {
      if (!skipValidation && context.conflictingPurchaseExists) {
        throw new ConflictingPurchaseExistsException();
      }
      salePrice = 0;

      if (!skipValidation && purchasePrice <= 0) {
        throw new PurchasePriceMustBePositiveException();
      }
      return { purchasePrice, salePrice };
    }

    // SALE
    if (!context.vehicleId) {
      throw new VehicleIdRequiredForSaleException();
    }

    if (!skipValidation) {
      if (!context.latestValidPurchase) {
        throw new NoValidPurchaseForSaleException();
      }
      if (salePrice <= 0) {
        throw new SalePriceMustBePositiveException();
      }
      if (context.conflictingSaleExists) {
        throw new ConflictingSaleExistsException();
      }
    }

    if (context.latestValidPurchase) {
      purchasePrice = context.latestValidPurchase.purchasePrice;
    }

    return { purchasePrice, salePrice };
  }
}
