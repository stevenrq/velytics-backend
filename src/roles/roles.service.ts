import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { PrismaService } from '../prisma/prisma.service';
import { assertNotStale } from '../common/utils/optimistic-lock';
import { isKnownPermission } from '../auth/permissions.catalog';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import {
  RoleNotFoundException,
  UnknownPermissionsException,
} from './exceptions/role.exceptions';

const ROLE_INCLUDE = {
  permissions: { include: { permission: true } },
} as const;

type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: typeof ROLE_INCLUDE;
}>;

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.prisma.role.findMany({
      include: ROLE_INCLUDE,
      orderBy: { id: 'asc' },
    });
    return roles.map((role) => this.toResponse(role));
  }

  async findOne(id: number): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: ROLE_INCLUDE,
    });
    if (!role) {
      this.logger.error('Role not found', {
        key: 'roles.errors.NOT_FOUND',
        roleId: id,
      });
      throw new RoleNotFoundException(id);
    }
    return this.toResponse(role);
  }

  async create(dto: CreateRoleDto): Promise<RoleResponseDto> {
    this.assertKnownPermissions(dto.permissionNames ?? []);

    const permissions = dto.permissionNames?.length
      ? await this.prisma.permission.findMany({
          where: { name: { in: dto.permissionNames } },
        })
      : [];

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        permissions: {
          create: permissions.map((permission) => ({
            permissionId: permission.id,
          })),
        },
      },
      include: ROLE_INCLUDE,
    });

    return this.toResponse(role);
  }

  async replacePermissions(
    id: number,
    permissionNames: string[],
    expectedUpdatedAt: Date,
  ): Promise<RoleResponseDto> {
    await this.ensureExists(id);
    this.assertKnownPermissions(permissionNames);

    const permissions = permissionNames.length
      ? await this.prisma.permission.findMany({
          where: { name: { in: permissionNames } },
        })
      : [];

    await this.prisma.$transaction(async (tx) => {
      await assertNotStale(tx.role, id, expectedUpdatedAt);
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      await tx.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: id,
          permissionId: permission.id,
        })),
      });
    });

    const role = await this.prisma.role.findUniqueOrThrow({
      where: { id },
      include: ROLE_INCLUDE,
    });
    return this.toResponse(role);
  }

  async remove(id: number): Promise<void> {
    await this.ensureExists(id);
    await this.prisma.role.delete({ where: { id } });
  }

  private async ensureExists(id: number): Promise<void> {
    const count = await this.prisma.role.count({ where: { id } });
    if (count === 0) {
      this.logger.error('Role not found', {
        key: 'roles.errors.NOT_FOUND',
        roleId: id,
      });
      throw new RoleNotFoundException(id);
    }
  }

  private assertKnownPermissions(names: string[]): void {
    const unknown = names.filter((name) => !isKnownPermission(name));
    if (unknown.length > 0) {
      throw new UnknownPermissionsException(unknown);
    }
  }

  private toResponse(role: RoleWithPermissions): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      description: this.describe(role.name, role.description),
      permissions: role.permissions.map((rp) => rp.permission.name),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  /**
   * Localizes seed role descriptions (ADMIN/USER); user-defined roles have no
   * catalog key, so their stored description is returned verbatim.
   */
  private describe(name: string, stored: string | null): string | undefined {
    const lang = I18nContext.current()?.lang ?? 'es';
    const key = `roles.descriptions.${name}`;
    const translated = this.i18n.translate<string, string>(key, { lang });
    if (translated && translated !== key) {
      return translated;
    }
    return stored ?? undefined;
  }
}
