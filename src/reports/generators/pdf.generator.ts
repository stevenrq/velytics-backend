import { dirname, join } from 'node:path';
// pdfmake 0.3.x ships no types matching @types/pdfmake's older API; typed
// locally against the subset of the runtime API this generator uses.
// eslint-disable-next-line @typescript-eslint/no-require-imports
import pdfMakeModule = require('pdfmake');
import type { ReportRow } from '../report-row.type';
import type { ReportLabels } from '../report-labels';

interface PdfDocument {
  getBuffer(): Promise<Buffer>;
}

interface PdfMakeApi {
  setLocalAccessPolicy(callback: (path: string) => boolean): void;
  addFonts(fonts: Record<string, Record<string, string>>): void;
  createPdf(docDefinition: Record<string, unknown>): PdfDocument;
}

const pdfMake = pdfMakeModule as unknown as PdfMakeApi;

const fontsDir = join(
  dirname(require.resolve('pdfmake/package.json')),
  'fonts',
  'Roboto',
);

pdfMake.setLocalAccessPolicy(() => true);
pdfMake.addFonts({
  Roboto: {
    normal: join(fontsDir, 'Roboto-Regular.ttf'),
    bold: join(fontsDir, 'Roboto-Medium.ttf'),
    italics: join(fontsDir, 'Roboto-Italic.ttf'),
    bolditalics: join(fontsDir, 'Roboto-MediumItalic.ttf'),
  },
});

export function generatePdf(
  rows: ReportRow[],
  rangeLabel: string,
  labels: ReportLabels,
): Promise<Buffer> {
  const h = labels.headers;
  const body = [
    [
      h.ID,
      h.TYPE,
      h.STATUS,
      h.CLIENT,
      h.VEHICLE,
      h.PURCHASE_PRICE,
      h.SALE_PRICE,
      h.DATE,
    ].map((text) => ({ text, bold: true })),
    ...rows.map((row) => [
      String(row.id),
      row.contractType,
      row.contractStatus,
      row.clientName,
      row.vehicleInfo || '-',
      labels.formatCurrency(row.purchasePrice),
      labels.formatCurrency(row.salePrice),
      labels.formatDate(row.createdAt),
    ]),
  ];

  const docDefinition = {
    pageOrientation: 'landscape' as const,
    pageMargins: [30, 40, 30, 30] as [number, number, number, number],
    defaultStyle: { font: 'Roboto', fontSize: 8 },
    content: [
      {
        text: labels.title,
        style: 'title',
      },
      { text: rangeLabel, style: 'subtitle' },
      {
        table: {
          headerRows: 1,
          widths: [30, 45, 55, '*', '*', 65, 65, 65],
          body,
        },
        layout: 'lightHorizontalLines',
      },
    ],
    styles: {
      title: {
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 4] as [number, number, number, number],
      },
      subtitle: {
        fontSize: 9,
        color: '#666666',
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
    },
  };

  return pdfMake.createPdf(docDefinition).getBuffer();
}
