import { Module } from '@nestjs/common';
import { CarsController } from './cars.controller';
import { MotorcyclesController } from './motorcycles.controller';
import { CarsService } from './cars.service';
import { MotorcyclesService } from './motorcycles.service';
import { VehiclesCoreService } from './vehicles-core.service';

@Module({
  controllers: [CarsController, MotorcyclesController],
  providers: [CarsService, MotorcyclesService, VehiclesCoreService],
  exports: [VehiclesCoreService],
})
export class VehiclesModule {}
