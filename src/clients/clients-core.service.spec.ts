import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsCoreService } from './clients-core.service';
import {
  CompanyNotFoundException,
  PersonNotFoundException,
} from './exceptions/client.exceptions';

/**
 * Mirrors the users decoupling test: asserts the ClientType -> exception
 * mapping and the thrown types/keys without ever touching I18nService.
 */
describe('ClientsCoreService domain exceptions', () => {
  function buildService(count = 0) {
    const prisma = {
      client: { count: jest.fn().mockResolvedValue(count) },
    } as unknown as PrismaService;
    return new ClientsCoreService(prisma);
  }

  it('maps PERSON to PersonNotFoundException with clients.errors.PERSON_NOT_FOUND', () => {
    const service = buildService();
    const exception = service.notFoundException('PERSON', 42);
    expect(exception).toBeInstanceOf(PersonNotFoundException);
    expect(exception.translationKey).toBe('clients.errors.PERSON_NOT_FOUND');
    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
  });

  it('maps COMPANY to CompanyNotFoundException with clients.errors.COMPANY_NOT_FOUND', () => {
    const service = buildService();
    const exception = service.notFoundException('COMPANY', 7);
    expect(exception).toBeInstanceOf(CompanyNotFoundException);
    expect(exception.translationKey).toBe('clients.errors.COMPANY_NOT_FOUND');
  });

  it('ensureExists throws PersonNotFoundException when no matching client exists', async () => {
    const service = buildService(0);
    await expect(service.ensureExists('PERSON', 999)).rejects.toBeInstanceOf(
      PersonNotFoundException,
    );
  });
});
