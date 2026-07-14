/**
 * Every controller in the app. Used by the permission-catalog drift test to
 * make sure every @RequirePermissions(...) name actually exists in the
 * static catalog. Keep this list in sync when adding a controller.
 */
import { AuthController } from './auth/auth.controller';
import { JwksController } from './auth/jwks.controller';
import { UsersController } from './users/users.controller';
import { RolesController } from './roles/roles.controller';
import { PermissionsController } from './permissions/permissions.controller';
import { HealthController } from './health/health.controller';
import { PersonsController } from './clients/persons.controller';
import { CompaniesController } from './clients/companies.controller';
import { CarsController } from './vehicles/cars.controller';
import { MotorcyclesController } from './vehicles/motorcycles.controller';
import { VehicleImagesController } from './vehicle-images/vehicle-images.controller';
import { DashboardController } from './dashboard/dashboard.controller';
import { ReportsController } from './reports/reports.controller';
import { PurchaseSalesController } from './purchase-sales/purchase-sales.controller';

export const ALL_CONTROLLERS = [
  AuthController,
  JwksController,
  UsersController,
  RolesController,
  PermissionsController,
  HealthController,
  PersonsController,
  CompaniesController,
  CarsController,
  MotorcyclesController,
  VehicleImagesController,
  DashboardController,
  ReportsController,
  PurchaseSalesController,
];
