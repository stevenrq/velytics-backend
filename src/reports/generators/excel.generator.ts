import ExcelJS from 'exceljs';
import type { ReportRow } from '../report-row.type';
import type { ReportLabels } from '../report-labels';

export async function generateExcel(
  rows: ReportRow[],
  labels: ReportLabels,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Velytics';
  workbook.created = new Date();

  const h = labels.headers;
  const sheet = workbook.addWorksheet(labels.sheetName);
  sheet.columns = [
    { header: h.ID, key: 'id', width: 8 },
    { header: h.TYPE, key: 'contractType', width: 12 },
    { header: h.STATUS, key: 'contractStatus', width: 14 },
    { header: h.CLIENT, key: 'clientName', width: 26 },
    { header: h.IDENTIFIER, key: 'clientIdentifier', width: 16 },
    { header: h.USER, key: 'userName', width: 24 },
    { header: h.VEHICLE, key: 'vehicleInfo', width: 30 },
    { header: h.PURCHASE_PRICE, key: 'purchasePrice', width: 18 },
    { header: h.SALE_PRICE, key: 'salePrice', width: 18 },
    { header: h.PAYMENT_METHOD, key: 'paymentMethod', width: 22 },
    { header: h.PAYMENT_TERMS, key: 'paymentTerms', width: 32 },
    { header: h.LIMITATIONS, key: 'paymentLimitations', width: 28 },
    { header: h.OBSERVATIONS, key: 'observations', width: 40 },
    { header: h.CREATED, key: 'createdAt', width: 20 },
    { header: h.UPDATED, key: 'updatedAt', width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow({
      id: row.id,
      contractType: row.contractType,
      contractStatus: row.contractStatus,
      clientName: row.clientName,
      clientIdentifier: row.clientIdentifier,
      userName: row.userName,
      vehicleInfo: row.vehicleInfo,
      purchasePrice: labels.formatCurrency(row.purchasePrice),
      salePrice: labels.formatCurrency(row.salePrice),
      paymentMethod: row.paymentMethod,
      paymentTerms: row.paymentTerms,
      paymentLimitations: row.paymentLimitations,
      observations: row.observations,
      createdAt: labels.formatDate(row.createdAt),
      updatedAt: labels.formatDate(row.updatedAt),
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
