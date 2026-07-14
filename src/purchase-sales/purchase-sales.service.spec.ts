import { PrismaService } from '../prisma/prisma.service';
import { PurchaseSalesService } from './purchase-sales.service';
import { ContractRulesService } from './contract-rules.service';
import { StatusHistoryService } from './status-history.service';
import {
  ClientReferenceNotFoundException,
  DeleteRequiresCanceledStatusException,
  PurchaseSaleNotFoundException,
  UserReferenceNotFoundException,
} from './exceptions/purchase-sale.exceptions';

/**
 * Mirrors the users/clients/vehicles decoupling tests: asserts the thrown
 * domain exception types without ever touching I18nService.
 */
describe('PurchaseSalesService domain exceptions', () => {
  function buildService(overrides?: {
    purchaseSaleFindUnique?: unknown;
    clientCount?: number;
    userCount?: number;
  }) {
    const prisma = {
      purchaseSale: {
        findUnique: jest
          .fn()
          .mockResolvedValue(overrides?.purchaseSaleFindUnique ?? null),
        delete: jest.fn().mockResolvedValue({}),
      },
      client: {
        count: jest.fn().mockResolvedValue(overrides?.clientCount ?? 1),
      },
      user: { count: jest.fn().mockResolvedValue(overrides?.userCount ?? 1) },
    } as unknown as PrismaService;

    const cache = { del: jest.fn() };

    return new PurchaseSalesService(
      prisma,
      new ContractRulesService(),
      { record: jest.fn() } as unknown as StatusHistoryService,
      cache as never,
    );
  }

  it('findOne throws PurchaseSaleNotFoundException when the contract does not exist', async () => {
    const service = buildService({ purchaseSaleFindUnique: null });
    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      PurchaseSaleNotFoundException,
    );
  });

  it('create throws ClientReferenceNotFoundException when clientId does not resolve', async () => {
    const service = buildService({ clientCount: 0 });
    await expect(
      service.create(
        {
          clientId: 1,
          userId: 1,
          paymentLimitations: 'x',
          paymentTerms: 'y',
          paymentMethod: 'BANK_TRANSFER',
        } as never,
        1,
      ),
    ).rejects.toBeInstanceOf(ClientReferenceNotFoundException);
  });

  it('create throws UserReferenceNotFoundException when userId does not resolve', async () => {
    const service = buildService({ userCount: 0 });
    await expect(
      service.create(
        {
          clientId: 1,
          userId: 1,
          paymentLimitations: 'x',
          paymentTerms: 'y',
          paymentMethod: 'BANK_TRANSFER',
        } as never,
        1,
      ),
    ).rejects.toBeInstanceOf(UserReferenceNotFoundException);
  });

  it('remove throws DeleteRequiresCanceledStatusException when the contract is not CANCELED', async () => {
    const service = buildService({
      purchaseSaleFindUnique: { id: 1, contractStatus: 'ACTIVE' },
    });
    await expect(service.remove(1)).rejects.toBeInstanceOf(
      DeleteRequiresCanceledStatusException,
    );
  });
});
