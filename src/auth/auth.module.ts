import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { loadRsaKeyPair } from '../config/rsa-keys';
import type { JwtConfig } from '../config/configuration';
import { AuthController } from './auth.controller';
import { JwksController } from './jwks.controller';
import { AuthService } from './auth.service';
import { JwtTokenService } from './jwt-token.service';
import { RefreshTokenService } from './refresh-token.service';
import { TokenDenylistService } from './token-denylist.service';
import { RefreshCookieFactory } from './refresh-cookie.factory';
import { CsrfCookieFactory } from './csrf-cookie.factory';
import { RbacBootstrapService } from './rbac-bootstrap.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { CsrfGuard } from './guards/csrf.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtConfig = configService.get<JwtConfig>('jwt')!;
        const { privateKey, publicKey } = loadRsaKeyPair(jwtConfig);
        return {
          privateKey,
          publicKey,
          signOptions: {
            algorithm: 'RS256' as const,
            issuer: jwtConfig.issuer,
            expiresIn: jwtConfig.accessTtlSeconds,
          },
          verifyOptions: {
            algorithms: ['RS256' as const],
            issuer: jwtConfig.issuer,
          },
        };
      },
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 1000 }]),
  ],
  controllers: [AuthController, JwksController],
  providers: [
    AuthService,
    JwtTokenService,
    RefreshTokenService,
    TokenDenylistService,
    RefreshCookieFactory,
    CsrfCookieFactory,
    RbacBootstrapService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
  exports: [JwtTokenService, TokenDenylistService, RefreshTokenService],
})
export class AuthModule {}
