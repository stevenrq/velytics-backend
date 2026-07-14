import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { PrismaService } from '../prisma/prisma.service';
import { parseRangeEnd, parseRangeStart } from '../common/utils/date-range';
import { generatePdf } from './generators/pdf.generator';
import { generateExcel } from './generators/excel.generator';
import { generateCsv } from './generators/csv.generator';
import { ReportRow } from './report-row.type';
import { buildReportLabels, ReportLabels } from './report-labels';

export type ReportFormat = 'pdf' | 'excel' | 'csv';

export interface GeneratedReport {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

const REPORT_INCLUDE = { client: true, user: true, vehicle: true } as const;

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async generate(
    format: ReportFormat,
    startDate?: string,
    endDate?: string,
  ): Promise<GeneratedReport> {
    const lang = I18nContext.current()?.lang ?? 'es';
    const labels = buildReportLabels(this.i18n, lang);
    const rows = await this.fetchRows(labels, startDate, endDate);
    const rangeLabel = labels.buildRangeLabel(startDate, endDate);
    const datePart = new Date().toISOString().slice(0, 10);

    switch (format) {
      case 'pdf':
        return {
          buffer: await generatePdf(rows, rangeLabel, labels),
          filename: `${labels.filenamePrefix}-${datePart}.pdf`,
          contentType: 'application/pdf',
        };
      case 'excel':
        return {
          buffer: await generateExcel(rows, labels),
          filename: `${labels.filenamePrefix}-${datePart}.xlsx`,
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
      case 'csv':
        return {
          buffer: generateCsv(rows, labels),
          filename: `${labels.filenamePrefix}-${datePart}.csv`,
          contentType: 'text/csv',
        };
    }
  }

  private async fetchRows(
    labels: ReportLabels,
    startDate?: string,
    endDate?: string,
  ): Promise<ReportRow[]> {
    const where: Prisma.PurchaseSaleWhereInput = {};
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: parseRangeStart(startDate) }),
        ...(endDate && { lte: parseRangeEnd(endDate) }),
      };
    }

    const rows = await this.prisma.purchaseSale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: REPORT_INCLUDE,
    });

    return rows.map((row) => ({
      id: row.id,
      contractType: labels.contractType[row.contractType],
      contractStatus: labels.contractStatus[row.contractStatus],
      clientName:
        row.client.type === 'PERSON'
          ? `${row.client.firstName} ${row.client.lastName}`
          : row.client.companyName!,
      clientIdentifier:
        row.client.type === 'PERSON'
          ? row.client.nationalId!
          : row.client.taxId!,
      userName: `${row.user.firstName} ${row.user.lastName}`,
      vehicleInfo: row.vehicle
        ? `${row.vehicle.brand} ${row.vehicle.model} - ${row.vehicle.plate}`
        : '',
      purchasePrice: row.purchasePrice.toNumber(),
      salePrice: row.salePrice.toNumber(),
      paymentMethod: labels.paymentMethod[row.paymentMethod],
      paymentTerms: row.paymentTerms,
      paymentLimitations: row.paymentLimitations,
      observations: row.observations ?? '',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }
}
