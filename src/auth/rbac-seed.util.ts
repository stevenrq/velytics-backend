import * as bcrypt from 'bcrypt';
import type { PrismaClient } from '@prisma/client';
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS_CATALOG,
  PERMISSION_NAMES,
  ROLE_NAMES,
} from './permissions.catalog';

const BCRYPT_ROUNDS = 12;

export interface AdminSeedConfig {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  phoneNumber: string;
}

type PrismaLike = Pick<
  PrismaClient,
  'permission' | 'role' | 'rolePermission' | 'user'
>;

/**
 * Reconciles the static permission catalog and default roles into the
 * database, then ensures the configured admin user exists. Shared by
 * RbacBootstrapService (runs on every app boot) and prisma/seed/seed.ts
 * (runs via `prisma db seed`, without booting the Nest app).
 */
export async function reconcileRbacAndAdmin(
  prisma: PrismaLike,
  admin: AdminSeedConfig,
  onWarn: (message: string) => void = () => {},
): Promise<void> {
  await reconcilePermissions(prisma, onWarn);
  await reconcileRoles(prisma);
  await seedAdminUser(prisma, admin);
}

async function reconcilePermissions(
  prisma: PrismaLike,
  onWarn: (message: string) => void,
): Promise<void> {
  for (const definition of PERMISSIONS_CATALOG) {
    await prisma.permission.upsert({
      where: { name: definition.name },
      update: { description: definition.description },
      create: definition,
    });
  }

  const orphans = await prisma.permission.findMany({
    where: { name: { notIn: [...PERMISSION_NAMES] } },
    select: { name: true },
  });
  if (orphans.length > 0) {
    onWarn(
      `Orphaned permissions in DB with no catalog equivalent (not deleted): ${orphans
        .map((o) => o.name)
        .join(', ')}`,
    );
  }
}

async function reconcileRoles(prisma: PrismaLike): Promise<void> {
  for (const [roleName, permissionNames] of Object.entries(
    DEFAULT_ROLE_PERMISSIONS,
  )) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description:
          roleName === ROLE_NAMES.ADMIN
            ? 'Role with full system access.'
            : 'Base role for standard system users.',
      },
    });

    const permissions = await prisma.permission.findMany({
      where: { name: { in: [...permissionNames] } },
    });

    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });
  }
}

async function seedAdminUser(
  prisma: PrismaLike,
  admin: AdminSeedConfig,
): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { username: admin.username },
  });
  if (existing) {
    return;
  }

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: ROLE_NAMES.ADMIN },
  });

  const passwordHash = await bcrypt.hash(admin.password, BCRYPT_ROUNDS);

  await prisma.user.create({
    data: {
      nationalId: admin.nationalId,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      phoneNumber: admin.phoneNumber,
      username: admin.username,
      password: passwordHash,
      enabled: true,
      roles: { create: { roleId: adminRole.id } },
    },
  });
}
