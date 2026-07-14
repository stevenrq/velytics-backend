import { Injectable } from '@nestjs/common';
import type { ContractStatus, Prisma } from '@prisma/client';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { PrismaService } from '../prisma/prisma.service';
import { ContractStatusHistoryResponseDto } from './dto/status-history-response.dto';

type TransactionClient = Prisma.TransactionClient;

/**
 * Stable, language-neutral reason codes persisted for system-generated status
 * changes. Translated at read time via `purchase-sales.history.<CODE>`.
 */
export const STATUS_HISTORY_REASON = {
  CONTRACT_CREATED: 'CONTRACT_CREATED',
  STATUS_UPDATED: 'STATUS_UPDATED',
} as const;

@Injectable()
export class StatusHistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  record(
    tx: TransactionClient,
    data: {
      purchaseSaleId: number;
      previousStatus: ContractStatus | null;
      newStatus: ContractStatus;
      changedById: number | null;
      reason: string;
    },
  ) {
    return tx.contractStatusHistory.create({ data });
  }

  async findByPurchaseSale(
    purchaseSaleId: number,
  ): Promise<ContractStatusHistoryResponseDto[]> {
    const rows = await this.prisma.contractStatusHistory.findMany({
      where: { purchaseSaleId },
      orderBy: { changedAt: 'asc' },
    });
    const lang = I18nContext.current()?.lang ?? 'es';
    return rows.map((row) => ({
      id: row.id,
      purchaseSaleId: row.purchaseSaleId,
      previousStatus: row.previousStatus ?? undefined,
      newStatus: row.newStatus,
      changedBy: row.changedById ?? undefined,
      changedAt: row.changedAt,
      reason: this.localizeReason(row.reason, lang),
    }));
  }

  /**
   * Translates a known system reason code; any other value (user-supplied or
   * legacy free-form text) is returned verbatim.
   */
  private localizeReason(
    reason: string | null,
    lang: string,
  ): string | undefined {
    if (!reason) {
      return undefined;
    }
    const key = `purchase-sales.history.${reason}`;
    const translated = this.i18n.translate<string, string>(key, { lang });
    return translated === key ? reason : translated;
  }
}
