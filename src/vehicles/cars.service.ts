import { Injectable, Logger } from '@nestjs/common';
import { Prisma, VehicleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/pagination';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { VehiclesCoreService } from './vehicles-core.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { CarQueryDto } from './dto/car-query.dto';
import { CarResponseDto } from './dto/vehicle-response.dto';

@Injectable()
export class CarsService {
  private readonly logger = new Logger(CarsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly core: VehiclesCoreService,
  ) {}

  async create(dto: CreateCarDto): Promise<CarResponseDto> {
    const vehicle = await this.prisma.vehicle.create({
      data: {
        type: 'CAR',
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
        bodyType: dto.bodyType,
        fuelType: dto.fuelType,
        numberOfDoors: dto.numberOfDoors,
      },
    });
    return this.toResponse(vehicle);
  }

  async findAll(query: CarQueryDto): Promise<PageResponseDto<CarResponseDto>> {
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
    return this.core.count('CAR');
  }

  async findOne(id: number): Promise<CarResponseDto> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, type: 'CAR' },
    });
    if (!vehicle) {
      this.logger.error('Car not found', {
        key: 'vehicles.errors.CAR_NOT_FOUND',
        carId: id,
      });
      throw this.core.notFoundException('CAR', id);
    }
    return this.toResponse(vehicle);
  }

  async update(id: number, dto: UpdateCarDto): Promise<CarResponseDto> {
    await this.core.ensureExists('CAR', id);
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
        bodyType: dto.bodyType,
        fuelType: dto.fuelType,
        numberOfDoors: dto.numberOfDoors,
      },
    });
    return this.toResponse(vehicle);
  }

  changeStatus(id: number, status: VehicleStatus) {
    return this.core.changeStatus('CAR', id, status);
  }

  remove(id: number) {
    return this.core.remove('CAR', id);
  }

  private buildWhere(query: CarQueryDto): Prisma.VehicleWhereInput {
    return {
      type: 'CAR',
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
      ...(query.fuelType && {
        fuelType: { contains: query.fuelType, mode: 'insensitive' as const },
      }),
      ...(query.bodyType && {
        bodyType: { contains: query.bodyType, mode: 'insensitive' as const },
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
  ): CarResponseDto {
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
      bodyType: vehicle.bodyType!,
      fuelType: vehicle.fuelType!,
      numberOfDoors: vehicle.numberOfDoors!,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
  }
}
