import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import {
  ContractStatus,
  ContractType,
  PaymentMethod,
  Prisma,
} from '@prisma/client';
import type { Client, User, Vehicle } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { parseRangeEnd, parseRangeStart } from '../common/utils/date-range';
import { DASHBOARD_CACHE_KEY } from '../dashboard/dashboard-cache.constants';
import {
  ContractRulesService,
  ContractRuleContext,
} from './contract-rules.service';
import {
  StatusHistoryService,
  STATUS_HISTORY_REASON,
} from './status-history.service';
import { CreatePurchaseSaleDto } from './dto/create-purchase-sale.dto';
import { UpdatePurchaseSaleDto } from './dto/update-purchase-sale.dto';
import { PurchaseSaleQueryDto } from './dto/purchase-sale-query.dto';
import {
  ClientSummaryDto,
  PurchaseSaleDetailResponseDto,
  PurchaseSaleResponseDto,
  UserSummaryDto,
  VehicleSummaryDto,
} from './dto/purchase-sale-response.dto';
import { VehicleCreationRequestDto } from './dto/vehicle-creation-request.dto';
import { ContractStatusHistoryResponseDto } from './dto/status-history-response.dto';
import {
  ClientReferenceNotFoundException,
  ContractTypeImmutableException,
  DeleteRequiresCanceledStatusException,
  PurchaseSaleNotFoundException,
  UserReferenceNotFoundException,
  VehicleDataNotApplicableForSaleException,
  VehicleIdAndDataConflictException,
  VehicleIdRequiredForSaleException,
  VehiclePurchasePriceMustBePositiveException,
  VehicleReferenceNotFoundException,
  VehicleRequiredForPurchaseException,
} from './exceptions/purchase-sale.exceptions';

type TransactionClient = Prisma.TransactionClient;

const DETAIL_INCLUDE = { client: true, user: true, vehicle: true } as const;
type PurchaseSaleWithDetails = Prisma.PurchaseSaleGetPayload<{
  include: typeof DETAIL_INCLUDE;
}>;
type PurchaseSalePlain = Prisma.PurchaseSaleGetPayload<object>;

const ACTIVE_PURCHASE_STATUSES: ContractStatus[] = ['PENDING', 'ACTIVE'];
const BLOCKING_SALE_STATUSES: ContractStatus[] = [
  'PENDING',
  'ACTIVE',
  'COMPLETED',
];
const VALID_PURCHASE_STATUSES: ContractStatus[] = ['ACTIVE', 'COMPLETED'];

@Injectable()
export class PurchaseSalesService {
  private readonly logger = new Logger(PurchaseSalesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contractRules: ContractRulesService,
    private readonly statusHistory: StatusHistoryService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  /** Contracts feed the dashboard summary; invalidate it on every mutation. */
  private async invalidateDashboardCache(): Promise<void> {
    await this.cache.del(DASHBOARD_CACHE_KEY);
  }

  async create(
    dto: CreatePurchaseSaleDto,
    currentUserId: number,
  ): Promise<PurchaseSaleResponseDto> {
    const contractType: ContractType = dto.contractType ?? 'PURCHASE';
    const contractStatus: ContractStatus = dto.contractStatus ?? 'PENDING';

    await this.ensureClientExists(this.prisma, dto.clientId);
    await this.ensureUserExists(this.prisma, dto.userId);

    const result = await this.prisma.$transaction(async (tx) => {
      const vehicleId = await this.resolveVehicleForCreate(
        tx,
        contractType,
        dto,
      );

      const facts = await this.gatherRuleFacts(
        tx,
        contractType,
        vehicleId,
        null,
      );
      const context: ContractRuleContext = {
        contractType,
        contractStatus,
        vehicleId,
        purchasePrice: dto.purchasePrice ?? 0,
        salePrice: dto.salePrice ?? 0,
        ...facts,
      };
      const { purchasePrice, salePrice } = this.contractRules.apply(context);

      const created = await tx.purchaseSale.create({
        data: {
          clientId: dto.clientId,
          userId: dto.userId,
          vehicleId,
          purchasePrice: new Prisma.Decimal(purchasePrice),
          salePrice: new Prisma.Decimal(salePrice),
          contractType,
          contractStatus,
          paymentLimitations: dto.paymentLimitations,
          paymentTerms: dto.paymentTerms,
          paymentMethod: dto.paymentMethod,
          observations: dto.observations,
        },
      });

      await this.statusHistory.record(tx, {
        purchaseSaleId: created.id,
        previousStatus: null,
        newStatus: contractStatus,
        changedById: currentUserId,
        reason: STATUS_HISTORY_REASON.CONTRACT_CREATED,
      });

      await this.syncVehicleStatus(tx, contractType, contractStatus, vehicleId);

      return this.toResponse(created);
    });

    await this.invalidateDashboardCache();
    return result;
  }

  async findAll(
    query: PurchaseSaleQueryDto,
  ): Promise<
    PageResponseDto<PurchaseSaleResponseDto | PurchaseSaleDetailResponseDto>
  > {
    const where = this.buildWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [totalItems, rows] = await Promise.all([
      this.prisma.purchaseSale.count({ where }),
      this.prisma.purchaseSale.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: query.detailed ? DETAIL_INCLUDE : undefined,
      }),
    ]);

    const data = rows.map((row) =>
      query.detailed
        ? this.toDetailResponse(row as PurchaseSaleWithDetails)
        : this.toResponse(row),
    );

    return new PageResponseDto(data, query.page, query.limit, totalItems);
  }

  async findOne(id: number): Promise<PurchaseSaleDetailResponseDto> {
    const row = await this.prisma.purchaseSale.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!row) {
      this.logger.error('Purchase sale not found', {
        key: 'purchase-sales.errors.NOT_FOUND',
        purchaseSaleId: id,
      });
      throw new PurchaseSaleNotFoundException(id);
    }
    return this.toDetailResponse(row);
  }

  async statusHistoryFor(
    id: number,
  ): Promise<ContractStatusHistoryResponseDto[]> {
    await this.ensurePurchaseSaleExists(id);
    return this.statusHistory.findByPurchaseSale(id);
  }

  async availableVehicleIds(): Promise<number[]> {
    const rows = await this.prisma.$queryRaw<
      { vehicle_id: number }[]
    >(Prisma.sql`
      SELECT DISTINCT vehicle_id FROM purchase_sales
      WHERE contract_type = 'PURCHASE' AND contract_status IN ('ACTIVE', 'COMPLETED') AND vehicle_id IS NOT NULL
        AND vehicle_id NOT IN (
          SELECT vehicle_id FROM purchase_sales
          WHERE contract_type = 'SALE' AND contract_status IN ('PENDING', 'ACTIVE', 'COMPLETED') AND vehicle_id IS NOT NULL
        )
      ORDER BY vehicle_id
    `);
    return rows.map((row) => row.vehicle_id);
  }

  async update(
    id: number,
    dto: UpdatePurchaseSaleDto,
    currentUserId: number,
  ): Promise<PurchaseSaleResponseDto> {
    const existing = await this.prisma.purchaseSale.findUnique({
      where: { id },
    });
    if (!existing) {
      this.logger.error('Purchase sale not found', {
        key: 'purchase-sales.errors.NOT_FOUND',
        purchaseSaleId: id,
      });
      throw new PurchaseSaleNotFoundException(id);
    }
    if (dto.contractType && dto.contractType !== existing.contractType) {
      throw new ContractTypeImmutableException();
    }

    const contractType = existing.contractType;
    const contractStatus: ContractStatus =
      dto.contractStatus ?? existing.contractStatus;
    const vehicleId =
      dto.vehicleId !== undefined ? dto.vehicleId : existing.vehicleId;

    if (dto.clientId) {
      await this.ensureClientExists(this.prisma, dto.clientId);
    }
    if (dto.userId) {
      await this.ensureUserExists(this.prisma, dto.userId);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      if (vehicleId) {
        await this.ensureVehicleExists(tx, vehicleId);
      }

      const facts = await this.gatherRuleFacts(tx, contractType, vehicleId, id);
      const context: ContractRuleContext = {
        contractType,
        contractStatus,
        vehicleId,
        purchasePrice: dto.purchasePrice ?? existing.purchasePrice.toNumber(),
        salePrice: dto.salePrice ?? existing.salePrice.toNumber(),
        ...facts,
      };
      const { purchasePrice, salePrice } = this.contractRules.apply(context);

      const updated = await tx.purchaseSale.update({
        where: { id },
        data: {
          clientId: dto.clientId,
          userId: dto.userId,
          vehicleId,
          purchasePrice: new Prisma.Decimal(purchasePrice),
          salePrice: new Prisma.Decimal(salePrice),
          contractStatus,
          paymentLimitations: dto.paymentLimitations,
          paymentTerms: dto.paymentTerms,
          paymentMethod: dto.paymentMethod,
          observations: dto.observations,
        },
      });

      if (contractStatus !== existing.contractStatus) {
        await this.statusHistory.record(tx, {
          purchaseSaleId: id,
          previousStatus: existing.contractStatus,
          newStatus: contractStatus,
          changedById: currentUserId,
          reason: STATUS_HISTORY_REASON.STATUS_UPDATED,
        });
        await this.syncVehicleStatus(
          tx,
          contractType,
          contractStatus,
          vehicleId,
          existing.contractStatus,
        );
      }

      return this.toResponse(updated);
    });

    await this.invalidateDashboardCache();
    return result;
  }

  async remove(id: number): Promise<void> {
    const existing = await this.prisma.purchaseSale.findUnique({
      where: { id },
    });
    if (!existing) {
      this.logger.error('Purchase sale not found', {
        key: 'purchase-sales.errors.NOT_FOUND',
        purchaseSaleId: id,
      });
      throw new PurchaseSaleNotFoundException(id);
    }
    if (existing.contractStatus !== 'CANCELED') {
      throw new DeleteRequiresCanceledStatusException();
    }
    await this.prisma.purchaseSale.delete({ where: { id } });
    await this.invalidateDashboardCache();
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  private async resolveVehicleForCreate(
    tx: TransactionClient,
    contractType: ContractType,
    dto: CreatePurchaseSaleDto,
  ): Promise<number | null> {
    if (contractType === 'PURCHASE') {
      if (dto.vehicleId && dto.vehicleData) {
        throw new VehicleIdAndDataConflictException();
      }
      if (dto.vehicleId) {
        await this.ensureVehicleExists(tx, dto.vehicleId);
        return dto.vehicleId;
      }
      if (!dto.vehicleData) {
        throw new VehicleRequiredForPurchaseException();
      }
      const vehicle = await this.createEmbeddedVehicle(tx, dto.vehicleData);
      return vehicle.id;
    }

    // SALE
    if (dto.vehicleData) {
      throw new VehicleDataNotApplicableForSaleException();
    }
    if (!dto.vehicleId) {
      throw new VehicleIdRequiredForSaleException();
    }
    await this.ensureVehicleExists(tx, dto.vehicleId);
    return dto.vehicleId;
  }

  private async createEmbeddedVehicle(
    tx: TransactionClient,
    data: VehicleCreationRequestDto,
  ): Promise<Vehicle> {
    // Strictly positive purchase price is a vehicle-intake rule, enforced
    // unconditionally (not gated by CANCELED-skips-validation, which only
    // applies to contract-status rules).
    if (data.purchasePrice <= 0) {
      throw new VehiclePurchasePriceMustBePositiveException();
    }
    return tx.vehicle.create({
      data: {
        type: data.type,
        brand: data.brand,
        model: data.model,
        line: data.line,
        capacity: data.capacity,
        plate: data.plate,
        motorNumber: data.motorNumber,
        serialNumber: data.serialNumber,
        chassisNumber: data.chassisNumber,
        color: data.color,
        cityRegistered: data.cityRegistered,
        year: data.year,
        mileage: data.mileage,
        transmission: data.transmission,
        status: 'AVAILABLE',
        purchasePrice: new Prisma.Decimal(data.purchasePrice),
        salePrice: new Prisma.Decimal(data.salePrice),
        bodyType: data.type === 'CAR' ? data.bodyType : undefined,
        fuelType: data.type === 'CAR' ? data.fuelType : undefined,
        numberOfDoors: data.type === 'CAR' ? data.numberOfDoors : undefined,
        motorcycleType:
          data.type === 'MOTORCYCLE' ? data.motorcycleType : undefined,
      },
    });
  }

  private async gatherRuleFacts(
    tx: TransactionClient,
    contractType: ContractType,
    vehicleId: number | null,
    excludeContractId: number | null,
  ): Promise<
    Pick<
      ContractRuleContext,
      | 'conflictingPurchaseExists'
      | 'latestValidPurchase'
      | 'conflictingSaleExists'
    >
  > {
    if (contractType === 'PURCHASE') {
      const conflictingPurchaseExists =
        (await tx.purchaseSale.count({
          where: {
            vehicleId,
            contractType: 'PURCHASE',
            contractStatus: { in: ACTIVE_PURCHASE_STATUSES },
            ...(excludeContractId ? { id: { not: excludeContractId } } : {}),
          },
        })) > 0;
      return {
        conflictingPurchaseExists,
        latestValidPurchase: null,
        conflictingSaleExists: false,
      };
    }

    const latestValidPurchase = await tx.purchaseSale.findFirst({
      where: {
        vehicleId,
        contractType: 'PURCHASE',
        contractStatus: { in: VALID_PURCHASE_STATUSES },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const conflictingSaleExists =
      (await tx.purchaseSale.count({
        where: {
          vehicleId,
          contractType: 'SALE',
          contractStatus: { in: BLOCKING_SALE_STATUSES },
          ...(excludeContractId ? { id: { not: excludeContractId } } : {}),
        },
      })) > 0;

    return {
      conflictingPurchaseExists: false,
      latestValidPurchase: latestValidPurchase
        ? {
            id: latestValidPurchase.id,
            purchasePrice: latestValidPurchase.purchasePrice.toNumber(),
          }
        : null,
      conflictingSaleExists,
    };
  }

  /**
   * Keeps vehicle.status in sync with the sale lifecycle instead of relying
   * purely on contract-derived availability. Only reverts SOLD -> AVAILABLE on
   * cancellation (never clobbers a manually set IN_MAINTENANCE/IN_REPAIR/etc.
   * status).
   */
  private async syncVehicleStatus(
    tx: TransactionClient,
    contractType: ContractType,
    newStatus: ContractStatus,
    vehicleId: number | null,
    previousContractStatus?: ContractStatus,
  ): Promise<void> {
    if (contractType !== 'SALE' || !vehicleId) {
      return;
    }
    if (newStatus === 'COMPLETED') {
      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'SOLD' },
      });
    } else if (
      newStatus === 'CANCELED' &&
      previousContractStatus !== undefined
    ) {
      const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
      if (vehicle?.status === 'SOLD') {
        await tx.vehicle.update({
          where: { id: vehicleId },
          data: { status: 'AVAILABLE' },
        });
      }
    }
  }

  private async ensureClientExists(
    client: PrismaService,
    clientId: number,
  ): Promise<void> {
    const count = await client.client.count({ where: { id: clientId } });
    if (count === 0) {
      this.logger.error('Client reference not found', {
        key: 'purchase-sales.errors.CLIENT_NOT_FOUND',
        clientId,
      });
      throw new ClientReferenceNotFoundException(clientId);
    }
  }

  private async ensureUserExists(
    client: PrismaService,
    userId: number,
  ): Promise<void> {
    const count = await client.user.count({ where: { id: userId } });
    if (count === 0) {
      this.logger.error('User reference not found', {
        key: 'purchase-sales.errors.USER_NOT_FOUND',
        userId,
      });
      throw new UserReferenceNotFoundException(userId);
    }
  }

  private async ensureVehicleExists(
    tx: TransactionClient,
    vehicleId: number,
  ): Promise<void> {
    const count = await tx.vehicle.count({ where: { id: vehicleId } });
    if (count === 0) {
      this.logger.error('Vehicle reference not found', {
        key: 'purchase-sales.errors.VEHICLE_NOT_FOUND',
        vehicleId,
      });
      throw new VehicleReferenceNotFoundException(vehicleId);
    }
  }

  private async ensurePurchaseSaleExists(id: number): Promise<void> {
    const count = await this.prisma.purchaseSale.count({ where: { id } });
    if (count === 0) {
      this.logger.error('Purchase sale not found', {
        key: 'purchase-sales.errors.NOT_FOUND',
        purchaseSaleId: id,
      });
      throw new PurchaseSaleNotFoundException(id);
    }
  }

  private toResponse(row: PurchaseSalePlain): PurchaseSaleResponseDto {
    return {
      id: row.id,
      clientId: row.clientId,
      userId: row.userId,
      vehicleId: row.vehicleId ?? undefined,
      purchasePrice: row.purchasePrice.toNumber(),
      salePrice: row.salePrice.toNumber(),
      contractType: row.contractType,
      contractStatus: row.contractStatus,
      paymentLimitations: row.paymentLimitations,
      paymentTerms: row.paymentTerms,
      paymentMethod: row.paymentMethod,
      observations: row.observations ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toDetailResponse(
    row: PurchaseSaleWithDetails,
  ): PurchaseSaleDetailResponseDto {
    return {
      ...this.toResponse(row),
      clientSummary: this.toClientSummary(row.client),
      userSummary: this.toUserSummary(row.user),
      vehicleSummary: row.vehicle
        ? this.toVehicleSummary(row.vehicle)
        : undefined,
    };
  }

  private toClientSummary(client: Client): ClientSummaryDto {
    return {
      id: client.id,
      type: client.type,
      name:
        client.type === 'PERSON'
          ? `${client.firstName} ${client.lastName}`
          : client.companyName!,
      identifier: client.type === 'PERSON' ? client.nationalId! : client.taxId!,
      email: client.email,
      phoneNumber: client.phoneNumber,
    };
  }

  private toUserSummary(user: User): UserSummaryDto {
    return {
      id: user.id,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      username: user.username,
    };
  }

  private toVehicleSummary(vehicle: Vehicle): VehicleSummaryDto {
    return {
      id: vehicle.id,
      type: vehicle.type,
      brand: vehicle.brand,
      line: vehicle.line,
      model: vehicle.model,
      plate: vehicle.plate,
      status: vehicle.status,
    };
  }

  private buildWhere(
    query: PurchaseSaleQueryDto,
  ): Prisma.PurchaseSaleWhereInput {
    return {
      ...(query.contractType && { contractType: query.contractType }),
      ...(query.contractStatus && { contractStatus: query.contractStatus }),
      ...(query.clientId !== undefined && { clientId: query.clientId }),
      ...(query.userId !== undefined && { userId: query.userId }),
      ...(query.vehicleId !== undefined && { vehicleId: query.vehicleId }),
      ...(query.paymentMethod && { paymentMethod: query.paymentMethod }),
      ...((query.startDate || query.endDate) && {
        updatedAt: {
          ...(query.startDate && { gte: parseRangeStart(query.startDate) }),
          ...(query.endDate && { lte: parseRangeEnd(query.endDate) }),
        },
      }),
      ...((query.minPurchasePrice !== undefined ||
        query.maxPurchasePrice !== undefined) && {
        purchasePrice: {
          gte: query.minPurchasePrice,
          lte: query.maxPurchasePrice,
        },
      }),
      ...((query.minSalePrice !== undefined ||
        query.maxSalePrice !== undefined) && {
        salePrice: { gte: query.minSalePrice, lte: query.maxSalePrice },
      }),
      ...this.buildTermFilter(query.term),
    };
  }

  /**
   * Free-text search across payment fields and a substring match against the
   * contractType/contractStatus/paymentMethod enum names (e.g. "pend" matches
   * PENDING). When the term parses as a number, it additionally matches
   * ids/prices exactly.
   */
  private buildTermFilter(
    term?: string,
  ): Pick<Prisma.PurchaseSaleWhereInput, 'OR'> {
    if (!term) {
      return {};
    }

    const conditions: Prisma.PurchaseSaleWhereInput[] = [
      { paymentTerms: { contains: term, mode: 'insensitive' as const } },
      { paymentLimitations: { contains: term, mode: 'insensitive' as const } },
      { observations: { contains: term, mode: 'insensitive' as const } },
    ];

    const upperTerm = term.toUpperCase();
    for (const value of Object.values(ContractType)) {
      if (value.includes(upperTerm)) {
        conditions.push({ contractType: value });
      }
    }
    for (const value of Object.values(ContractStatus)) {
      if (value.includes(upperTerm)) {
        conditions.push({ contractStatus: value });
      }
    }
    for (const value of Object.values(PaymentMethod)) {
      if (value.includes(upperTerm)) {
        conditions.push({ paymentMethod: value });
      }
    }

    const numericTerm = Number(term);
    if (term.trim() !== '' && Number.isFinite(numericTerm)) {
      conditions.push(
        { id: numericTerm },
        { clientId: numericTerm },
        { userId: numericTerm },
        { vehicleId: numericTerm },
        { purchasePrice: numericTerm },
        { salePrice: numericTerm },
      );
    }

    return { OR: conditions };
  }
}
