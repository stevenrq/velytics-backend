import { Module } from '@nestjs/common';
import { PersonsController } from './persons.controller';
import { CompaniesController } from './companies.controller';
import { PersonsService } from './persons.service';
import { CompaniesService } from './companies.service';
import { ClientsCoreService } from './clients-core.service';

@Module({
  controllers: [PersonsController, CompaniesController],
  providers: [PersonsService, CompaniesService, ClientsCoreService],
})
export class ClientsModule {}
