import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { reconcileRbacAndAdmin } from '../../src/auth/rbac-seed.util';
import { adminConfig } from '../../src/config/configuration';

const DEMO_SQL_FILES = [
  '00_reset_transactional_data.sql',
  '01_demo_users.sql',
  '02_demo_clients.sql',
  '03_demo_vehicles.sql',
  '04_demo_purchase_sales.sql',
];

async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Reconciliando RBAC (permisos, roles) y usuario admin...');
    await reconcileRbacAndAdmin(prisma, adminConfig(), (message) =>
      console.warn(`[rbac] ${message}`),
    );
    console.log('RBAC y admin listos.');

    if (process.env.NODE_ENV === 'production') {
      console.log('NODE_ENV=production: se omiten los datos demo.');
      return;
    }

    for (const file of DEMO_SQL_FILES) {
      console.log(`Ejecutando seed demo: ${file}...`);
      const sql = readFileSync(join(__dirname, 'sql', file), 'utf8');
      await prisma.$executeRawUnsafe(sql);
    }
    console.log('Datos demo cargados.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
