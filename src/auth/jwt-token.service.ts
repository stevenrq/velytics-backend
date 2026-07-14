import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AccessTokenPayload {
  sub: string;
  username: string;
  jti: string;
  authorities: string[];
  iss: string;
  iat: number;
  exp: number;
}

export interface SignedAccessToken {
  accessToken: string;
  jti: string;
  expiresAt: Date;
}

@Injectable()
export class JwtTokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(
    user: { id: number; username: string },
    authorities: string[],
  ): SignedAccessToken {
    const jti = randomUUID();
    const accessToken = this.jwtService.sign(
      { username: user.username, authorities },
      { subject: String(user.id), jwtid: jti },
    );
    const { exp } = this.jwtService.decode<AccessTokenPayload>(accessToken);
    return { accessToken, jti, expiresAt: new Date(exp * 1000) };
  }

  async verify(token: string): Promise<AccessTokenPayload> {
    return this.jwtService.verifyAsync<AccessTokenPayload>(token);
  }
}
