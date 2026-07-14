import { HttpStatus } from '@nestjs/common';
import type { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from './roles.service';
import {
  RoleNotFoundException,
  UnknownPermissionsException,
} from './exceptions/role.exceptions';

/**
 * Mirrors the users decoupling test: asserts the thrown domain exception
 * types/keys without ever touching I18nService.
 */
describe('RolesService domain exceptions', () => {
  function buildService(overrides: Record<string, unknown>) {
    const prisma = overrides as unknown as PrismaService;
    const i18n = {} as unknown as I18nService;
    return new RolesService(prisma, i18n);
  }

  it('throws RoleNotFoundException carrying roles.errors.NOT_FOUND when the id is missing', async () => {
    const service = buildService({
      role: { findUnique: jest.fn().mockResolvedValue(null) },
    });

    await expect(service.findOne(999)).rejects.toMatchObject({
      constructor: RoleNotFoundException,
      translationKey: 'roles.errors.NOT_FOUND',
      roleId: 999,
    });
  });

  it('maps RoleNotFoundException to HTTP 404', () => {
    expect(new RoleNotFoundException(1).getStatus()).toBe(HttpStatus.NOT_FOUND);
  });

  it('throws UnknownPermissionsException with the unknown names joined into args', async () => {
    const service = buildService({
      role: { count: jest.fn().mockResolvedValue(1) },
      permission: { findMany: jest.fn().mockResolvedValue([]) },
      rolePermission: {},
    });

    await expect(
      service.replacePermissions(1, ['ghost:permission'], new Date()),
    ).rejects.toMatchObject({
      constructor: UnknownPermissionsException,
      translationKey: 'roles.errors.UNKNOWN_PERMISSIONS',
      translationArgs: { permissions: 'ghost:permission' },
    });
  });
});
