import { stringify } from 'csv-stringify/sync';
import type { ReportRow } from '../report-row.type';
import type { ReportLabels } from '../report-labels';

export function generateCsv(rows: ReportRow[], labels: ReportLabels): Buffer {
  const h = labels.headers;
  const header = [
    h.ID,
    h.TYPE,
    h.STATUS,
    h.CLIENT,
    h.IDENTIFIER,
    h.USER,
    h.VEHICLE,
    h.PURCHASE_PRICE,
    h.SALE_PRICE,
    h.PAYMENT_METHOD,
    h.PAYMENT_TERMS,
    h.LIMITATIONS,
    h.OBSERVATIONS,
    h.CREATED,
    h.UPDATED,
  ];

  const data = rows.map((row) => [
    row.id,
    row.contractType,
    row.contractStatus,
    row.clientName,
    row.clientIdentifier,
    row.userName,
    row.vehicleInfo,
    labels.formatCurrency(row.purchasePrice),
    labels.formatCurrency(row.salePrice),
    row.paymentMethod,
    row.paymentTerms,
    row.paymentLimitations,
    row.observations,
    labels.formatDate(row.createdAt),
    labels.formatDate(row.updatedAt),
  ]);

  const csv = stringify([header, ...data]);
  return Buffer.from(csv, 'utf8');
}
