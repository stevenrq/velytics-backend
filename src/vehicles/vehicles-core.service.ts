import { Injectable, Logger } from '@nestjs/common';
import type { VehicleStatus, VehicleType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { VehicleCountDto } from './dto/vehicle-response.dto';
import {
  CarNotFoundException,
  MotorcycleNotFoundException,
} from './exceptions/vehicle.exceptions';
import type { DomainException } from '../common/exceptions/domain.exception';

@Injectable()
export class VehiclesCoreService {
  private readonly logger = new Logger(VehiclesCoreService.name);

  constructor(private readonly prisma: PrismaService) {}

  async count(type: VehicleType): Promise<VehicleCountDto> {
    const [total, available] = await Promise.all([
      this.prisma.vehicle.count({ where: { type } }),
      this.prisma.vehicle.count({ where: { type, status: 'AVAILABLE' } }),
    ]);
    return { total, available, unavailable: total - available };
  }

  async ensureExists(type: VehicleType, id: number): Promise<void> {
    const count = await this.prisma.vehicle.count({ where: { id, type } });
    if (count === 0) {
      this.logVehicleNotFound(type, id);
      throw this.notFoundException(type, id);
    }
  }

  async changeStatus(
    type: VehicleType,
    id: number,
    status: VehicleStatus,
  ): Promise<{ status: VehicleStatus }> {
    await this.ensureExists(type, id);
    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: { status },
    });
    return { status: vehicle.status };
  }

  async remove(type: VehicleType, id: number): Promise<void> {
    await this.ensureExists(type, id);
    await this.prisma.vehicle.delete({ where: { id } });
  }

  /** Single place mapping a VehicleType to its typed domain exception. */
  notFoundException(type: VehicleType, id?: number): DomainException {
    return type === 'CAR'
      ? new CarNotFoundException(id)
      : new MotorcycleNotFoundException(id);
  }

  private logVehicleNotFound(type: VehicleType, id: number): void {
    const key =
      type === 'CAR'
        ? 'vehicles.errors.CAR_NOT_FOUND'
        : 'vehicles.errors.MOTORCYCLE_NOT_FOUND';
    this.logger.error(`${type === 'CAR' ? 'Car' : 'Motorcycle'} not found`, {
      key,
      id,
    });
  }
}
