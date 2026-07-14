-- CreateEnum
CREATE TYPE "ClientType" AS ENUM(
    'PERSON',
    'COMPANY'
);

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM(
    'CAR',
    'MOTORCYCLE'
);

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM(
    'AVAILABLE',
    'SOLD',
    'IN_MAINTENANCE',
    'IN_REPAIR',
    'IN_USE',
    'INACTIVE'
);

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM(
    'PURCHASE',
    'SALE'
);

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM(
    'PENDING',
    'ACTIVE',
    'COMPLETED',
    'CANCELED'
);

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM(
    'CASH',
    'BANK_TRANSFER',
    'BANK_DEPOSIT',
    'CASHIERS_CHECK',
    'MIXED',
    'FINANCING',
    'DIGITAL_WALLET',
    'TRADE_IN',
    'INSTALLMENT_PAYMENT'
);

-- CreateTable
CREATE TABLE "addresses"(
    "id" serial NOT NULL,
    "street" varchar(100) NOT NULL,
    "number" varchar(20) NOT NULL,
    "city" varchar(50) NOT NULL,
    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users"(
    "id" serial NOT NULL,
    "national_id" varchar(10) NOT NULL,
    "first_name" varchar(20) NOT NULL,
    "last_name" varchar(20) NOT NULL,
    "email" varchar(40) NOT NULL,
    "phone_number" varchar(10) NOT NULL,
    "username" varchar(20) NOT NULL,
    "password" varchar(72) NOT NULL,
    "enabled" boolean NOT NULL DEFAULT TRUE,
    "address_id" integer,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles"(
    "id" serial NOT NULL,
    "name" varchar(20) NOT NULL,
    "description" text,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions"(
    "id" serial NOT NULL,
    "name" varchar(50) NOT NULL,
    "description" text,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_roles"(
    "user_id" integer NOT NULL,
    "role_id" integer NOT NULL,
    CONSTRAINT "users_roles_pkey" PRIMARY KEY ("user_id", "role_id")
);

-- CreateTable
CREATE TABLE "roles_permissions"(
    "role_id" integer NOT NULL,
    "permission_id" integer NOT NULL,
    CONSTRAINT "roles_permissions_pkey" PRIMARY KEY ("role_id", "permission_id")
);

-- CreateTable
CREATE TABLE "refresh_tokens"(
    "id" serial NOT NULL,
    "token_hash" char(64) NOT NULL,
    "user_id" integer NOT NULL,
    "expires_at" timestamp(3) NOT NULL,
    "revoked" boolean NOT NULL DEFAULT FALSE,
    "revoked_at" timestamp(3),
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients"(
    "id" serial NOT NULL,
    "type" "ClientType" NOT NULL,
    "phone_number" varchar(10) NOT NULL,
    "email" varchar(40) NOT NULL,
    "enabled" boolean NOT NULL DEFAULT TRUE,
    "address_id" integer,
    "national_id" varchar(10),
    "first_name" varchar(30),
    "last_name" varchar(30),
    "tax_id" varchar(10),
    "company_name" varchar(30),
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles"(
    "id" serial NOT NULL,
    "type" "VehicleType" NOT NULL,
    "brand" varchar(20) NOT NULL,
    "model" varchar(20) NOT NULL,
    "line" varchar(20) NOT NULL,
    "capacity" integer NOT NULL,
    "plate" varchar(10) NOT NULL,
    "motor_number" varchar(30) NOT NULL,
    "serial_number" varchar(30) NOT NULL,
    "chassis_number" varchar(30) NOT NULL,
    "color" varchar(20) NOT NULL,
    "city_registered" varchar(30) NOT NULL,
    "year" integer NOT NULL,
    "mileage" integer NOT NULL,
    "transmission" varchar(20) NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "purchase_price" DECIMAL(12, 2) NOT NULL,
    "sale_price" DECIMAL(12, 2) NOT NULL,
    "body_type" varchar(20),
    "fuel_type" varchar(20),
    "number_of_doors" integer,
    "motorcycle_type" varchar(20),
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_images"(
    "id" serial NOT NULL,
    "vehicle_id" integer NOT NULL,
    "bucket" varchar(100) NOT NULL,
    "key" varchar(255) NOT NULL,
    "file_name" varchar(255) NOT NULL,
    "mime_type" varchar(100) NOT NULL,
    "size" integer NOT NULL,
    "is_primary" boolean NOT NULL DEFAULT FALSE,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vehicle_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_sales"(
    "id" serial NOT NULL,
    "client_id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "vehicle_id" integer,
    "purchase_price" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "sale_price" DECIMAL(12, 2) NOT NULL DEFAULT 0,
    "contract_type" "ContractType" NOT NULL,
    "contract_status" "ContractStatus" NOT NULL DEFAULT 'PENDING',
    "payment_limitations" varchar(200) NOT NULL,
    "payment_terms" varchar(200) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "observations" varchar(500),
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    CONSTRAINT "purchase_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_status_history"(
    "id" serial NOT NULL,
    "purchase_sale_id" integer NOT NULL,
    "previous_status" "ContractStatus",
    "new_status" "ContractStatus" NOT NULL,
    "changed_by" integer,
    "changed_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" varchar(300),
    CONSTRAINT "contract_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_national_id_key" ON "users"("national_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_address_id_key" ON "users"("address_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_phone_number_key" ON "clients"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_key" ON "clients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_address_id_key" ON "clients"("address_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_national_id_key" ON "clients"("national_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_tax_id_key" ON "clients"("tax_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_company_name_key" ON "clients"("company_name");

-- CreateIndex
CREATE INDEX "clients_type_idx" ON "clients"("type");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_key" ON "vehicles"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_motor_number_key" ON "vehicles"("motor_number");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_serial_number_key" ON "vehicles"("serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_chassis_number_key" ON "vehicles"("chassis_number");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicles_brand_model_idx" ON "vehicles"("brand", "model");

-- CreateIndex
CREATE INDEX "vehicles_year_idx" ON "vehicles"("year");

-- CreateIndex
CREATE INDEX "vehicles_city_registered_idx" ON "vehicles"("city_registered");

-- CreateIndex
CREATE INDEX "vehicles_type_idx" ON "vehicles"("type");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_images_key_key" ON "vehicle_images"("key");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_images_file_name_key" ON "vehicle_images"("file_name");

-- CreateIndex
CREATE INDEX "vehicle_images_vehicle_id_idx" ON "vehicle_images"("vehicle_id");

-- CreateIndex
CREATE INDEX "purchase_sales_client_id_idx" ON "purchase_sales"("client_id");

-- CreateIndex
CREATE INDEX "purchase_sales_user_id_idx" ON "purchase_sales"("user_id");

-- CreateIndex
CREATE INDEX "purchase_sales_vehicle_id_idx" ON "purchase_sales"("vehicle_id");

-- CreateIndex
CREATE INDEX "purchase_sales_contract_status_idx" ON "purchase_sales"("contract_status");

-- CreateIndex
CREATE INDEX "purchase_sales_contract_type_idx" ON "purchase_sales"("contract_type");

-- CreateIndex
CREATE INDEX "purchase_sales_created_at_idx" ON "purchase_sales"("created_at");

-- CreateIndex
CREATE INDEX "contract_status_history_purchase_sale_id_idx" ON "contract_status_history"("purchase_sale_id");

-- AddForeignKey
ALTER TABLE "users"
    ADD CONSTRAINT "users_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_roles"
    ADD CONSTRAINT "users_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_roles"
    ADD CONSTRAINT "users_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permissions"
    ADD CONSTRAINT "roles_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permissions"
    ADD CONSTRAINT "roles_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients"
    ADD CONSTRAINT "clients_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_images"
    ADD CONSTRAINT "vehicle_images_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_sales"
    ADD CONSTRAINT "purchase_sales_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_sales"
    ADD CONSTRAINT "purchase_sales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_sales"
    ADD CONSTRAINT "purchase_sales_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_status_history"
    ADD CONSTRAINT "contract_status_history_purchase_sale_id_fkey" FOREIGN KEY ("purchase_sale_id") REFERENCES "purchase_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_status_history"
    ADD CONSTRAINT "contract_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CheckConstraint (business rules not expressible in Prisma schema)
ALTER TABLE "vehicles"
    ADD CONSTRAINT "chk_vehicles_year" CHECK ("year" BETWEEN 1950 AND 2050);

ALTER TABLE "vehicles"
    ADD CONSTRAINT "chk_vehicles_mileage" CHECK ("mileage" >= 0);

ALTER TABLE "vehicles"
    ADD CONSTRAINT "chk_vehicles_prices" CHECK ("purchase_price" >= 0 AND "sale_price" >= 0);

ALTER TABLE "vehicles"
    ADD CONSTRAINT "chk_vehicles_subtype" CHECK (("type" = 'CAR' AND "motorcycle_type" IS NULL) OR ("type" = 'MOTORCYCLE' AND "body_type" IS NULL AND "fuel_type" IS NULL AND "number_of_doors" IS NULL));

ALTER TABLE "clients"
    ADD CONSTRAINT "chk_clients_subtype" CHECK (("type" = 'PERSON' AND "national_id" IS NOT NULL AND "first_name" IS NOT NULL AND "last_name" IS NOT NULL AND "tax_id" IS NULL AND "company_name" IS NULL) OR ("type" = 'COMPANY' AND "tax_id" IS NOT NULL AND "company_name" IS NOT NULL AND "national_id" IS NULL AND "first_name" IS NULL AND "last_name" IS NULL));

ALTER TABLE "purchase_sales"
    ADD CONSTRAINT "chk_ps_prices" CHECK ("purchase_price" >= 0 AND "sale_price" >= 0);

-- CreateIndex (partial unique index: at most one primary image per vehicle)
CREATE UNIQUE INDEX "uq_vehicle_primary_image" ON "vehicle_images"("vehicle_id")
WHERE
    "is_primary";

