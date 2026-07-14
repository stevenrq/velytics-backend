import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VehiclesCoreService } from './vehicles-core.service';
import {
  CarNotFoundException,
  MotorcycleNotFoundException,
} from './exceptions/vehicle.exceptions';

/**
 * Mirrors the users/clients decoupling tests: asserts the VehicleType ->
 * exception mapping without ever touching I18nService.
 */
describe('VehiclesCoreService domain exceptions', () => {
  function buildService(count = 0) {
    const prisma = {
      vehicle: { count: jest.fn().mockResolvedValue(count) },
    } as unknown as PrismaService;
    return new VehiclesCoreService(prisma);
  }

  it('maps CAR to CarNotFoundException with vehicles.errors.CAR_NOT_FOUND', () => {
    const service = buildService();
    const exception = service.notFoundException('CAR', 42);
    expect(exception).toBeInstanceOf(CarNotFoundException);
    expect(exception.translationKey).toBe('vehicles.errors.CAR_NOT_FOUND');
    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
  });

  it('maps MOTORCYCLE to MotorcycleNotFoundException with vehicles.errors.MOTORCYCLE_NOT_FOUND', () => {
    const service = buildService();
    const exception = service.notFoundException('MOTORCYCLE', 7);
    expect(exception).toBeInstanceOf(MotorcycleNotFoundException);
    expect(exception.translationKey).toBe(
      'vehicles.errors.MOTORCYCLE_NOT_FOUND',
    );
  });

  it('ensureExists throws CarNotFoundException when no matching vehicle exists', async () => {
    const service = buildService(0);
    await expect(service.ensureExists('CAR', 999)).rejects.toBeInstanceOf(
      CarNotFoundException,
    );
  });
});
