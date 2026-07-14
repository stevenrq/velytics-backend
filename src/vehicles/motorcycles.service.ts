import { Injectable, Logger } from '@nestjs/common';
import { Prisma, VehicleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/pagination';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { VehiclesCoreService } from './vehicles-core.service';
import { CreateMotorcycleDto } from './dto/create-motorcycle.dto';
import { UpdateMotorcycleDto } from './dto/update-motorcycle.dto';
import { MotorcycleQueryDto } from './dto/motorcycle-query.dto';
import { MotorcycleResponseDto } from './dto/vehicle-response.dto';

@Injectable()
export class MotorcyclesService {
  private readonly logger = new Logger(MotorcyclesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly core: VehiclesCoreService,
  ) {}

  async create(dto: CreateMotorcycleDto): Promise<MotorcycleResponseDto> {
    const vehicle = await this.prisma.vehicle.create({
      data: {
        type: 'MOTORCYCLE',
        brand: dto.brand,
        model: dto.model,
        line: dto.line,
        capacity: dto.capacity,
        plate: dto.plate,
        motorNumber: dto.motorNumber,
        serialNumber: dto.serialNumber,
        chassisNumber: dto.chassisNumber,
        color: dto.color,
        cityRegistered: dto.cityRegistered,
        year: dto.year,
        mileage: dto.mileage,
        transmission: dto.transmission,
        status: dto.status,
        purchasePrice: new Prisma.Decimal(dto.purchasePrice),
        salePrice: new Prisma.Decimal(dto.salePrice),
        motorcycleType: dto.motorcycleType,
      },
    });
    return this.toResponse(vehicle);
  }

  async findAll(
    query: MotorcycleQueryDto,
  ): Promise<PageResponseDto<MotorcycleResponseDto>> {
    const where = this.buildWhere(query);
    const page = await paginate(this.prisma.vehicle, {
      page: query.page,
      limit: query.limit,
      where,
      orderBy: { id: 'asc' },
    });
    return new PageResponseDto(
      page.data.map((vehicle) => this.toResponse(vehicle)),
      page.meta.page,
      page.meta.limit,
      page.meta.totalItems,
    );
  }

  count() {
    return this.core.count('MOTORCYCLE');
  }

  async findOne(id: number): Promise<MotorcycleResponseDto> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, type: 'MOTORCYCLE' },
    });
    if (!vehicle) {
      this.logger.error('Motorcycle not found', {
        key: 'vehicles.errors.MOTORCYCLE_NOT_FOUND',
        motorcycleId: id,
      });
      throw this.core.notFoundException('MOTORCYCLE', id);
    }
    return this.toResponse(vehicle);
  }

  async update(
    id: number,
    dto: UpdateMotorcycleDto,
  ): Promise<MotorcycleResponseDto> {
    await this.core.ensureExists('MOTORCYCLE', id);
    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: {
        brand: dto.brand,
        model: dto.model,
        line: dto.line,
        capacity: dto.capacity,
        plate: dto.plate,
        motorNumber: dto.motorNumber,
        serialNumber: dto.serialNumber,
        chassisNumber: dto.chassisNumber,
        color: dto.color,
        cityRegistered: dto.cityRegistered,
        year: dto.year,
        mileage: dto.mileage,
        transmission: dto.transmission,
        status: dto.status,
        purchasePrice:
          dto.purchasePrice !== undefined
            ? new Prisma.Decimal(dto.purchasePrice)
            : undefined,
        salePrice:
          dto.salePrice !== undefined
            ? new Prisma.Decimal(dto.salePrice)
            : undefined,
        motorcycleType: dto.motorcycleType,
      },
    });
    return this.toResponse(vehicle);
  }

  changeStatus(id: number, status: VehicleStatus) {
    return this.core.changeStatus('MOTORCYCLE', id, status);
  }

  remove(id: number) {
    return this.core.remove('MOTORCYCLE', id);
  }

  private buildWhere(query: MotorcycleQueryDto): Prisma.VehicleWhereInput {
    return {
      type: 'MOTORCYCLE',
      ...(query.plate && {
        plate: { contains: query.plate, mode: 'insensitive' as const },
      }),
      ...(query.brand && {
        brand: { contains: query.brand, mode: 'insensitive' as const },
      }),
      ...(query.line && {
        line: { contains: query.line, mode: 'insensitive' as const },
      }),
      ...(query.model && {
        model: { contains: query.model, mode: 'insensitive' as const },
      }),
      ...(query.transmission && {
        transmission: {
          contains: query.transmission,
          mode: 'insensitive' as const,
        },
      }),
      ...(query.city && {
        cityRegistered: { contains: query.city, mode: 'insensitive' as const },
      }),
      ...(query.status && { status: query.status }),
      ...(query.motorcycleType && {
        motorcycleType: {
          contains: query.motorcycleType,
          mode: 'insensitive' as const,
        },
      }),
      ...((query.minYear !== undefined || query.maxYear !== undefined) && {
        year: { gte: query.minYear, lte: query.maxYear },
      }),
      ...((query.minCapacity !== undefined ||
        query.maxCapacity !== undefined) && {
        capacity: { gte: query.minCapacity, lte: query.maxCapacity },
      }),
      ...((query.minMileage !== undefined ||
        query.maxMileage !== undefined) && {
        mileage: { gte: query.minMileage, lte: query.maxMileage },
      }),
      ...((query.minSalePrice !== undefined ||
        query.maxSalePrice !== undefined) && {
        salePrice: { gte: query.minSalePrice, lte: query.maxSalePrice },
      }),
    };
  }

  private toResponse(
    vehicle: Prisma.VehicleGetPayload<object>,
  ): MotorcycleResponseDto {
    return {
      id: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      line: vehicle.line,
      capacity: vehicle.capacity,
      plate: vehicle.plate,
      motorNumber: vehicle.motorNumber,
      serialNumber: vehicle.serialNumber,
      chassisNumber: vehicle.chassisNumber,
      color: vehicle.color,
      cityRegistered: vehicle.cityRegistered,
      year: vehicle.year,
      mileage: vehicle.mileage,
      transmission: vehicle.transmission,
      status: vehicle.status,
      purchasePrice: vehicle.purchasePrice.toNumber(),
      salePrice: vehicle.salePrice.toNumber(),
      motorcycleType: vehicle.motorcycleType!,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
  }
}
