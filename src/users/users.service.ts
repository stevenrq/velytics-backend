import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RefreshTokenService } from '../auth/refresh-token.service';
import { paginate } from '../common/utils/pagination';
import { assertNotStale } from '../common/utils/optimistic-lock';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserCountDto, UserResponseDto } from './dto/user-response.dto';
import { PasswordPolicyService } from './password-policy.service';
import {
  CurrentPasswordInvalidException,
  CurrentPasswordRequiredException,
  RoleUpdateForbiddenException,
  StatusChangeForbiddenException,
  UnknownRolesException,
  UserNotFoundException,
} from './exceptions/user.exceptions';
import type { RequestUser } from '../auth/types/request-user.type';
import { ROLE_NAMES } from '../auth/permissions.catalog';

const BCRYPT_ROUNDS = 12;

const USER_INCLUDE = {
  address: true,
  roles: { include: { role: true } },
} as const;

type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof USER_INCLUDE;
}>;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly passwordPolicyService: PasswordPolicyService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    await this.passwordPolicyService.assertNotBreached(dto.password);
    const roles = await this.resolveRoles(dto.roleNames);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        nationalId: dto.nationalId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        username: dto.username,
        password: passwordHash,
        enabled: dto.enabled ?? true,
        address: dto.address ? { create: dto.address } : undefined,
        roles: { create: roles.map((role) => ({ roleId: role.id })) },
      },
      include: USER_INCLUDE,
    });

    return this.toResponse(user);
  }

  async findAll(
    query: UserQueryDto,
  ): Promise<PageResponseDto<UserResponseDto>> {
    const where = this.buildWhere(query);
    const page = await paginate(this.prisma.user, {
      page: query.page,
      limit: query.limit,
      where,
      orderBy: { id: 'asc' },
      include: USER_INCLUDE,
    });
    return new PageResponseDto(
      (page.data as UserWithRelations[]).map((user) => this.toResponse(user)),
      page.meta.page,
      page.meta.limit,
      page.meta.totalItems,
    );
  }

  async count(): Promise<UserCountDto> {
    const [totalUsers, activeUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { enabled: true } }),
    ]);
    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
    };
  }

  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: USER_INCLUDE,
    });
    if (!user) {
      this.logger.error('User not found', {
        key: 'users.errors.NOT_FOUND',
        userId: id,
      });
      throw new UserNotFoundException(id);
    }
    return this.toResponse(user);
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    currentUser: RequestUser,
  ): Promise<UserResponseDto> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      this.logger.error('User not found', {
        key: 'users.errors.NOT_FOUND',
        userId: id,
      });
      throw new UserNotFoundException(id);
    }

    if (dto.roleNames !== undefined && !this.canManageRoles(currentUser)) {
      throw new RoleUpdateForbiddenException();
    }
    if (dto.enabled !== undefined && !this.canManageRoles(currentUser)) {
      throw new StatusChangeForbiddenException();
    }

    if (dto.password && currentUser.id === id) {
      // ASVS V6.2.3: self-service password changes must re-verify the
      // current password. An admin resetting another user's password via
      // user:update (currentUser.id !== id) is a legitimate bypass.
      if (!dto.currentPassword) {
        throw new CurrentPasswordRequiredException();
      }
      const currentPasswordMatches = await bcrypt.compare(
        dto.currentPassword,
        existing.password,
      );
      if (!currentPasswordMatches) {
        throw new CurrentPasswordInvalidException();
      }
    }
    if (dto.password) {
      await this.passwordPolicyService.assertNotBreached(dto.password);
    }

    const roles =
      dto.roleNames !== undefined
        ? await this.resolveRoles(dto.roleNames)
        : undefined;
    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, BCRYPT_ROUNDS)
      : undefined;

    const user = await this.prisma.$transaction(async (tx) => {
      if (dto.address) {
        if (existing.addressId) {
          await tx.address.update({
            where: { id: existing.addressId },
            data: dto.address,
          });
        } else {
          const address = await tx.address.create({ data: dto.address });
          await tx.user.update({
            where: { id },
            data: { addressId: address.id },
          });
        }
      }

      if (roles) {
        await assertNotStale(tx.user, id, new Date(dto.expectedUpdatedAt!));
        await tx.userRole.deleteMany({ where: { userId: id } });
      }

      return tx.user.update({
        where: { id },
        data: {
          nationalId: dto.nationalId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          username: dto.username,
          password: passwordHash,
          enabled: dto.enabled,
          roles: roles
            ? { create: roles.map((role) => ({ roleId: role.id })) }
            : undefined,
        },
        include: USER_INCLUDE,
      });
    });

    return this.toResponse(user);
  }

  async changeStatus(
    id: number,
    enabled: boolean,
  ): Promise<{ enabled: boolean }> {
    await this.ensureExists(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { enabled },
    });
    if (!enabled) {
      await this.refreshTokenService.revokeAllForUser(id);
    }
    return { enabled: user.enabled };
  }

  async remove(id: number): Promise<void> {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: { addressId: true },
    });
    if (!existing) {
      this.logger.error('User not found', {
        key: 'users.errors.NOT_FOUND',
        userId: id,
      });
      throw new UserNotFoundException(id);
    }
    // RefreshToken.userId already cascades on user delete (prisma/schema.prisma),
    // but revoking explicitly keeps this independent of that FK setting.
    await this.refreshTokenService.revokeAllForUser(id);
    // Prisma has no orphan-removal cascade, so the address (owned exclusively
    // by this user) is cleaned up explicitly here.
    await this.prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id } });
      if (existing.addressId) {
        await tx.address.delete({ where: { id: existing.addressId } });
      }
    });
  }

  private async ensureExists(id: number): Promise<void> {
    const count = await this.prisma.user.count({ where: { id } });
    if (count === 0) {
      this.logger.error('User not found', {
        key: 'users.errors.NOT_FOUND',
        userId: id,
      });
      throw new UserNotFoundException(id);
    }
  }

  private canManageRoles(currentUser: RequestUser): boolean {
    return (
      currentUser.isService === true ||
      currentUser.authorities.includes('user:update')
    );
  }

  private async resolveRoles(roleNames?: string[]) {
    const names =
      roleNames && roleNames.length > 0 ? roleNames : [ROLE_NAMES.USER];
    const roles = await this.prisma.role.findMany({
      where: { name: { in: names } },
    });
    if (roles.length !== new Set(names).size) {
      const found = new Set(roles.map((r) => r.name));
      const missing = names.filter((name) => !found.has(name));
      this.logger.error('Unknown roles requested', {
        key: 'users.errors.UNKNOWN_ROLES',
        roles: missing,
      });
      throw new UnknownRolesException(missing);
    }
    return roles;
  }

  private buildWhere(query: UserQueryDto) {
    return {
      ...(query.name && {
        OR: [
          { firstName: { contains: query.name, mode: 'insensitive' as const } },
          { lastName: { contains: query.name, mode: 'insensitive' as const } },
        ],
      }),
      ...(query.username && {
        username: { contains: query.username, mode: 'insensitive' as const },
      }),
      ...(query.email && {
        email: { contains: query.email, mode: 'insensitive' as const },
      }),
      ...(query.role && {
        roles: { some: { role: { name: query.role } } },
      }),
      ...(query.enabled !== undefined && { enabled: query.enabled }),
    };
  }

  private toResponse(user: UserWithRelations): UserResponseDto {
    return {
      id: user.id,
      nationalId: user.nationalId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      username: user.username,
      enabled: user.enabled,
      address: user.address ?? undefined,
      roles: user.roles.map((userRole) => userRole.role.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
