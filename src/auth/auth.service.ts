import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtTokenService } from './jwt-token.service';
import { RefreshTokenService } from './refresh-token.service';
import { TokenDenylistService } from './token-denylist.service';
import {
  buildAuthorities,
  USER_WITH_AUTHORITIES_INCLUDE,
} from './authorities.util';
import {
  AuthenticatedUserDto,
  LoginResponseDto,
} from './dto/auth-response.dto';
import { InvalidCredentialsException } from './exceptions/auth.exceptions';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly denylistService: TokenDenylistService,
  ) {}

  async login(
    username: string,
    password: string,
  ): Promise<{
    response: Omit<LoginResponseDto, 'csrfToken'>;
    rawRefreshToken: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: USER_WITH_AUTHORITIES_INCLUDE,
    });

    if (!user || !user.enabled) {
      throw new InvalidCredentialsException();
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new InvalidCredentialsException();
    }

    const authorities = buildAuthorities(user.roles);
    const { accessToken } = this.jwtTokenService.sign(user, authorities);
    const rawRefreshToken = await this.refreshTokenService.issue(user.id);

    return {
      response: {
        accessToken,
        user: this.toAuthenticatedUser(user, authorities),
      },
      rawRefreshToken,
    };
  }

  async refresh(
    rawRefreshToken: string,
  ): Promise<{ accessToken: string; rawRefreshToken: string }> {
    const rotated = await this.refreshTokenService.rotate(rawRefreshToken);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: rotated.userId },
      include: USER_WITH_AUTHORITIES_INCLUDE,
    });

    if (!user.enabled) {
      // rotate() already minted a successor token; it must not outlive a
      // disabled account, so revoke everything before rejecting the request.
      await this.refreshTokenService.revokeAllForUser(user.id);
      throw new InvalidCredentialsException();
    }

    const authorities = buildAuthorities(user.roles);
    const { accessToken } = this.jwtTokenService.sign(user, authorities);

    return { accessToken, rawRefreshToken: rotated.rawToken };
  }

  async logout(
    rawRefreshToken: string | undefined,
    jti: string | undefined,
    exp: number | undefined,
  ): Promise<void> {
    if (rawRefreshToken) {
      await this.refreshTokenService.revoke(rawRefreshToken);
    }
    if (jti && exp) {
      await this.denylistService.denylist(jti, new Date(exp * 1000));
    }
  }

  private toAuthenticatedUser(
    user: {
      id: number;
      username: string;
      email: string;
      firstName: string;
      lastName: string;
    },
    authorities: string[],
  ): AuthenticatedUserDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      authorities,
    };
  }
}
