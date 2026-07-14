import {
  ConflictingPurchaseExistsException,
  ConflictingSaleExistsException,
  NoValidPurchaseForSaleException,
  PurchasePriceMustBePositiveException,
  SalePriceMustBePositiveException,
  VehicleIdRequiredForSaleException,
} from './exceptions/purchase-sale.exceptions';
import {
  ContractRuleContext,
  ContractRulesService,
} from './contract-rules.service';

describe('ContractRulesService', () => {
  const service = new ContractRulesService();

  function baseContext(
    overrides: Partial<ContractRuleContext> = {},
  ): ContractRuleContext {
    return {
      contractType: 'PURCHASE',
      contractStatus: 'PENDING',
      vehicleId: 1,
      purchasePrice: 1000,
      salePrice: 0,
      conflictingPurchaseExists: false,
      latestValidPurchase: null,
      conflictingSaleExists: false,
      ...overrides,
    };
  }

  describe('PURCHASE', () => {
    it('accepts a valid new purchase and forces salePrice to 0', () => {
      const result = service.apply(baseContext({ salePrice: 999 }));
      expect(result).toEqual({ purchasePrice: 1000, salePrice: 0 });
    });

    it('rejects a purchase when the vehicle already has a pending/active one', () => {
      expect(() =>
        service.apply(baseContext({ conflictingPurchaseExists: true })),
      ).toThrow(ConflictingPurchaseExistsException);
    });

    it('rejects a purchase with purchasePrice <= 0', () => {
      expect(() => service.apply(baseContext({ purchasePrice: 0 }))).toThrow(
        PurchasePriceMustBePositiveException,
      );
    });

    it('skips duplicate/price validation when the target status is CANCELED', () => {
      const result = service.apply(
        baseContext({
          contractStatus: 'CANCELED',
          conflictingPurchaseExists: true,
          purchasePrice: 0,
        }),
      );
      expect(result).toEqual({ purchasePrice: 0, salePrice: 0 });
    });
  });

  describe('SALE', () => {
    function saleContext(
      overrides: Partial<ContractRuleContext> = {},
    ): ContractRuleContext {
      return baseContext({
        contractType: 'SALE',
        salePrice: 1500,
        latestValidPurchase: { id: 10, purchasePrice: 1000 },
        ...overrides,
      });
    }

    it('requires a vehicleId', () => {
      expect(() => service.apply(saleContext({ vehicleId: null }))).toThrow(
        VehicleIdRequiredForSaleException,
      );
    });

    it('rejects a sale with no prior ACTIVE/COMPLETED purchase', () => {
      expect(() =>
        service.apply(saleContext({ latestValidPurchase: null })),
      ).toThrow(NoValidPurchaseForSaleException);
    });

    it('rejects a sale with salePrice <= 0', () => {
      expect(() => service.apply(saleContext({ salePrice: 0 }))).toThrow(
        SalePriceMustBePositiveException,
      );
    });

    it('rejects a sale when another one is already pending/active/completed for the vehicle', () => {
      expect(() =>
        service.apply(saleContext({ conflictingSaleExists: true })),
      ).toThrow(ConflictingSaleExistsException);
    });

    it('overwrites purchasePrice from the latest valid purchase', () => {
      const result = service.apply(saleContext({ purchasePrice: 1 }));
      expect(result).toEqual({ purchasePrice: 1000, salePrice: 1500 });
    });

    it('skips validation when the target status is CANCELED, still applies purchase price', () => {
      const result = service.apply(
        saleContext({
          contractStatus: 'CANCELED',
          salePrice: 0,
          conflictingSaleExists: true,
        }),
      );
      expect(result).toEqual({ purchasePrice: 1000, salePrice: 0 });
    });
  });
});
