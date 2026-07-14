import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/pagination';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { ClientsCoreService } from './clients-core.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PersonQueryDto } from './dto/person-query.dto';
import { PersonResponseDto } from './dto/person-response.dto';

const PERSON_INCLUDE = { address: true } as const;

type PersonWithRelations = Prisma.ClientGetPayload<{
  include: typeof PERSON_INCLUDE;
}>;

@Injectable()
export class PersonsService {
  private readonly logger = new Logger(PersonsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly core: ClientsCoreService,
  ) {}

  async create(dto: CreatePersonDto): Promise<PersonResponseDto> {
    const client = await this.prisma.client.create({
      data: {
        type: 'PERSON',
        nationalId: dto.nationalId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        enabled: dto.enabled ?? true,
        address: dto.address ? { create: dto.address } : undefined,
      },
      include: PERSON_INCLUDE,
    });
    return this.toResponse(client);
  }

  async findAll(
    query: PersonQueryDto,
  ): Promise<PageResponseDto<PersonResponseDto>> {
    const where = this.buildWhere(query);
    const page = await paginate(this.prisma.client, {
      page: query.page,
      limit: query.limit,
      where,
      orderBy: { id: 'asc' },
      include: PERSON_INCLUDE,
    });
    return new PageResponseDto(
      (page.data as PersonWithRelations[]).map((client) =>
        this.toResponse(client),
      ),
      page.meta.page,
      page.meta.limit,
      page.meta.totalItems,
    );
  }

  count() {
    return this.core.count('PERSON');
  }

  async findOne(id: number): Promise<PersonResponseDto> {
    const client = await this.prisma.client.findFirst({
      where: { id, type: 'PERSON' },
      include: PERSON_INCLUDE,
    });
    if (!client) {
      this.logger.error('Person not found', {
        key: 'clients.errors.PERSON_NOT_FOUND',
        personId: id,
      });
      throw this.core.notFoundException('PERSON', id);
    }
    return this.toResponse(client);
  }

  async update(id: number, dto: UpdatePersonDto): Promise<PersonResponseDto> {
    await this.core.ensureExists('PERSON', id);
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
          nationalId: dto.nationalId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          enabled: dto.enabled,
        },
        include: PERSON_INCLUDE,
      });
    });

    return this.toResponse(client);
  }

  changeStatus(id: number, enabled: boolean) {
    return this.core.changeStatus('PERSON', id, enabled);
  }

  remove(id: number) {
    return this.core.remove('PERSON', id);
  }

  private buildWhere(query: PersonQueryDto): Prisma.ClientWhereInput {
    return {
      type: 'PERSON',
      ...(query.name && {
        OR: [
          { firstName: { contains: query.name, mode: 'insensitive' as const } },
          { lastName: { contains: query.name, mode: 'insensitive' as const } },
        ],
      }),
      ...(query.email && {
        email: { contains: query.email, mode: 'insensitive' as const },
      }),
      ...(query.nationalId && { nationalId: { contains: query.nationalId } }),
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

  private toResponse(client: PersonWithRelations): PersonResponseDto {
    return {
      id: client.id,
      nationalId: client.nationalId!,
      firstName: client.firstName!,
      lastName: client.lastName!,
      email: client.email,
      phoneNumber: client.phoneNumber,
      enabled: client.enabled,
      address: client.address ?? undefined,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };
  }
}
