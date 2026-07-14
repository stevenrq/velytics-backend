import {
  ContractStatus,
  ContractType,
  PaymentMethod,
  VehicleStatus,
} from '@prisma/client';
import type { I18nService } from 'nestjs-i18n';

export interface ReportHeaders {
  ID: string;
  TYPE: string;
  STATUS: string;
  CLIENT: string;
  IDENTIFIER: string;
  USER: string;
  VEHICLE: string;
  PURCHASE_PRICE: string;
  SALE_PRICE: string;
  PAYMENT_METHOD: string;
  PAYMENT_TERMS: string;
  LIMITATIONS: string;
  OBSERVATIONS: string;
  CREATED: string;
  UPDATED: string;
  DATE: string;
}

/**
 * Localized strings and formatters for a single report render. Enum labels,
 * headers and titles come from the i18n catalog; currency stays COP and the
 * timezone stays America/Bogota (business facts), while the number/date locale
 * follows the requested language.
 */
export interface ReportLabels {
  title: string;
  sheetName: string;
  filenamePrefix: string;
  headers: ReportHeaders;
  contractType: Record<ContractType, string>;
  contractStatus: Record<ContractStatus, string>;
  paymentMethod: Record<PaymentMethod, string>;
  vehicleStatus: Record<VehicleStatus, string>;
  buildRangeLabel(startDate?: string, endDate?: string): string;
  formatCurrency(value: number): string;
  formatDate(value: Date): string;
}

export function buildReportLabels(
  i18n: I18nService,
  lang: string,
): ReportLabels {
  const t = <T>(key: string, args?: Record<string, unknown>): T =>
    i18n.translate(`reports.labels.${key}`, { lang, args }) as T;

  const currencyFormatter = new Intl.NumberFormat(`${lang}-CO`, {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
  const dateFormatter = new Intl.DateTimeFormat(`${lang}-CO`, {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const openEnd = t<string>('openEnd');

  return {
    title: t<string>('title'),
    sheetName: t<string>('sheetName'),
    filenamePrefix: t<string>('filenamePrefix'),
    headers: t<ReportHeaders>('headers'),
    contractType: t<Record<ContractType, string>>('contractType'),
    contractStatus: t<Record<ContractStatus, string>>('contractStatus'),
    paymentMethod: t<Record<PaymentMethod, string>>('paymentMethod'),
    vehicleStatus: t<Record<VehicleStatus, string>>('vehicleStatus'),
    buildRangeLabel(startDate?: string, endDate?: string): string {
      if (!startDate && !endDate) {
        return t<string>('rangeAll');
      }
      return t<string>('rangeBetween', {
        start: startDate ?? openEnd,
        end: endDate ?? openEnd,
      });
    },
    formatCurrency: (value: number) => currencyFormatter.format(value),
    formatDate: (value: Date) => dateFormatter.format(value),
  };
}
