import { Injectable, Logger } from '@nestjs/common';
import type { ClientType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CountResponseDto } from '../common/dto/count-response.dto';
import {
  CompanyNotFoundException,
  PersonNotFoundException,
} from './exceptions/client.exceptions';
import type { DomainException } from '../common/exceptions/domain.exception';

@Injectable()
export class ClientsCoreService {
  private readonly logger = new Logger(ClientsCoreService.name);

  constructor(private readonly prisma: PrismaService) {}

  async count(type: ClientType): Promise<CountResponseDto> {
    const [total, active] = await Promise.all([
      this.prisma.client.count({ where: { type } }),
      this.prisma.client.count({ where: { type, enabled: true } }),
    ]);
    return { total, active, inactive: total - active };
  }

  async ensureExists(type: ClientType, id: number): Promise<void> {
    const count = await this.prisma.client.count({ where: { id, type } });
    if (count === 0) {
      this.logClientNotFound(type, id);
      throw this.notFoundException(type, id);
    }
  }

  async changeStatus(
    type: ClientType,
    id: number,
    enabled: boolean,
  ): Promise<{ enabled: boolean }> {
    await this.ensureExists(type, id);
    const client = await this.prisma.client.update({
      where: { id },
      data: { enabled },
    });
    return { enabled: client.enabled };
  }

  async remove(type: ClientType, id: number): Promise<void> {
    const existing = await this.prisma.client.findFirst({
      where: { id, type },
      select: { addressId: true },
    });
    if (!existing) {
      this.logClientNotFound(type, id);
      throw this.notFoundException(type, id);
    }
    // Prisma has no orphan-removal cascade, so the address (owned exclusively
    // by this client) is cleaned up explicitly here.
    await this.prisma.$transaction(async (tx) => {
      await tx.client.delete({ where: { id } });
      if (existing.addressId) {
        await tx.address.delete({ where: { id: existing.addressId } });
      }
    });
  }

  /** Single place mapping a ClientType to its typed domain exception. */
  notFoundException(type: ClientType, id?: number): DomainException {
    return type === 'PERSON'
      ? new PersonNotFoundException(id)
      : new CompanyNotFoundException(id);
  }

  private logClientNotFound(type: ClientType, id: number): void {
    const key =
      type === 'PERSON'
        ? 'clients.errors.PERSON_NOT_FOUND'
        : 'clients.errors.COMPANY_NOT_FOUND';
    this.logger.error(`${type === 'PERSON' ? 'Person' : 'Company'} not found`, {
      key,
      id,
    });
  }
}
