import { createHash, timingSafeEqual } from 'node:crypto';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { ALLOW_SERVICE_KEY } from '../../common/decorators/allow-service-key.decorator';
import { AccessTokenPayload, JwtTokenService } from '../jwt-token.service';
import { TokenDenylistService } from '../token-denylist.service';
import {
  AccessTokenInvalidException,
  AccessTokenRequiredException,
  AccessTokenRevokedException,
} from '../exceptions/auth.exceptions';
import '../types/request-user.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtTokenService: JwtTokenService,
    private readonly denylistService: TokenDenylistService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    const allowServiceKey = this.reflector.getAllAndOverride<boolean>(
      ALLOW_SERVICE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowServiceKey && this.matchesServiceKey(request)) {
      request.user = {
        id: -1,
        username: 'service',
        authorities: [],
        isService: true,
      };
      return true;
    }

    const token = this.extractToken(request);
    if (!token) {
      throw new AccessTokenRequiredException();
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtTokenService.verify(token);
    } catch {
      throw new AccessTokenInvalidException();
    }

    if (await this.denylistService.isDenylisted(payload.jti)) {
      throw new AccessTokenRevokedException();
    }

    request.user = {
      id: Number(payload.sub),
      username: payload.username,
      authorities: payload.authorities ?? [],
      jti: payload.jti,
      exp: payload.exp,
    };
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return undefined;
    }
    return header.slice('Bearer '.length);
  }

  private matchesServiceKey(request: Request): boolean {
    const provided = request.headers['x-service-key'];
    const expected = this.configService.get<string>('serviceKey.key');
    if (typeof provided !== 'string' || !expected) {
      return false;
    }
    const providedHash = createHash('sha256').update(provided).digest();
    const expectedHash = createHash('sha256').update(expected).digest();
    return timingSafeEqual(providedHash, expectedHash);
  }
}
