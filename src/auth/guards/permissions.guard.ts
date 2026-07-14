import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PERMISSIONS_KEY } from '../../common/decorators/require-permissions.decorator';
import { ALLOW_SELF_KEY } from '../../common/decorators/allow-self.decorator';
import { InsufficientPermissionsException } from '../exceptions/auth.exceptions';
import '../types/request-user.type';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user) {
      throw new InsufficientPermissionsException();
    }

    if (user.isService) {
      return true;
    }

    const hasPermission = requiredPermissions.some((permission) =>
      user.authorities.includes(permission),
    );
    if (hasPermission) {
      return true;
    }

    const allowSelfParam = this.reflector.getAllAndOverride<string>(
      ALLOW_SELF_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowSelfParam) {
      const paramValue = request.params[allowSelfParam];
      if (paramValue && Number(paramValue) === user.id) {
        return true;
      }
    }

    throw new InsufficientPermissionsException();
  }
}
