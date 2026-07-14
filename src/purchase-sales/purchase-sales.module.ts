import { Module } from '@nestjs/common';
import { PurchaseSalesController } from './purchase-sales.controller';
import { PurchaseSalesService } from './purchase-sales.service';
import { ContractRulesService } from './contract-rules.service';
import { StatusHistoryService } from './status-history.service';

@Module({
  controllers: [PurchaseSalesController],
  providers: [PurchaseSalesService, ContractRulesService, StatusHistoryService],
  exports: [PurchaseSalesService],
})
export class PurchaseSalesModule {}
