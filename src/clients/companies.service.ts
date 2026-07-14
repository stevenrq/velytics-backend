import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/pagination';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { ClientsCoreService } from './clients-core.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyQueryDto } from './dto/company-query.dto';
import { CompanyResponseDto } from './dto/company-response.dto';

const COMPANY_INCLUDE = { address: true } as const;

type CompanyWithRelations = Prisma.ClientGetPayload<{
  include: typeof COMPANY_INCLUDE;
}>;

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly core: ClientsCoreService,
  ) {}

  async create(dto: CreateCompanyDto): Promise<CompanyResponseDto> {
    const client = await this.prisma.client.create({
      data: {
        type: 'COMPANY',
        taxId: dto.taxId,
        companyName: dto.companyName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        enabled: dto.enabled ?? true,
        address: dto.address ? { create: dto.address } : undefined,
      },
      include: COMPANY_INCLUDE,
    });
    return this.toResponse(client);
  }

  async findAll(
    query: CompanyQueryDto,
  ): Promise<PageResponseDto<CompanyResponseDto>> {
    const where = this.buildWhere(query);
    const page = await paginate(this.prisma.client, {
      page: query.page,
      limit: query.limit,
      where,
      orderBy: { id: 'asc' },
      include: COMPANY_INCLUDE,
    });
    return new PageResponseDto(
      (page.data as CompanyWithRelations[]).map((client) =>
        this.toResponse(client),
      ),
      page.meta.page,
      page.meta.limit,
      page.meta.totalItems,
    );
  }

  count() {
    return this.core.count('COMPANY');
  }

  async findOne(id: number): Promise<CompanyResponseDto> {
    const client = await this.prisma.client.findFirst({
      where: { id, type: 'COMPANY' },
      include: COMPANY_INCLUDE,
    });
    if (!client) {
      this.logger.error('Company not found', {
        key: 'clients.errors.COMPANY_NOT_FOUND',
        companyId: id,
      });
      throw this.core.notFoundException('COMPANY', id);
    }
    return this.toResponse(client);
  }

  async update(id: number, dto: UpdateCompanyDto): Promise<CompanyResponseDto> {
    await this.core.ensureExists('COMPANY', id);
    const existing = await this.prisma.client.findUniqueOrThrow({
      where: { id },
    });

    const client = await this.prisma.$transaction(async (tx) => {
      if (dto.address) {
        if (existing.addressId) {
          await tx.address.update({
            where: { id: existing.addressId },
            data: dto.address,
          });
        } else {
          const address = await tx.address.create({ data: dto.address });
          await tx.client.update({
            where: { id },
            data: { addressId: address.id },
          });
        }
      }

      return tx.client.update({
        where: { id },
        data: {
          taxId: dto.taxId,
          companyName: dto.companyName,
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          enabled: dto.enabled,
        },
        include: COMPANY_INCLUDE,
      });
    });

    return this.toResponse(client);
  }

  changeStatus(id: number, enabled: boolean) {
    return this.core.changeStatus('COMPANY', id, enabled);
  }

  remove(id: number) {
    return this.core.remove('COMPANY', id);
  }

  private buildWhere(query: CompanyQueryDto): Prisma.ClientWhereInput {
    return {
      type: 'COMPANY',
      ...(query.taxId && { taxId: { contains: query.taxId } }),
      ...(query.companyName && {
        companyName: {
          contains: query.companyName,
          mode: 'insensitive' as const,
        },
      }),
      ...(query.email && {
        email: { contains: query.email, mode: 'insensitive' as const },
      }),
      ...(query.phoneNumber && {
        phoneNumber: { contains: query.phoneNumber },
      }),
      ...(query.enabled !== undefined && { enabled: query.enabled }),
      ...(query.city && {
        address: {
          city: { contains: query.city, mode: 'insensitive' as const },
        },
      }),
    };
  }

  private toResponse(client: CompanyWithRelations): CompanyResponseDto {
    return {
      id: client.id,
      taxId: client.taxId!,
      companyName: client.companyName!,
      email: client.email,
      phoneNumber: client.phoneNumber,
      enabled: client.enabled,
      address: client.address ?? undefined,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };
  }
}
