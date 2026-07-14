export interface ReportRow {
  id: number;
  contractType: string;
  contractStatus: string;
  clientName: string;
  clientIdentifier: string;
  userName: string;
  vehicleInfo: string;
  purchasePrice: number;
  salePrice: number;
  paymentMethod: string;
  paymentTerms: string;
  paymentLimitations: string;
  observations: string;
  createdAt: Date;
  updatedAt: Date;
}
