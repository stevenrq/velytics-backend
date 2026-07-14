import { createHash, createPublicKey } from 'node:crypto';
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from '../common/decorators/public.decorator';
import { loadRsaKeyPair } from '../config/rsa-keys';
import type { JwtConfig } from '../config/configuration';

interface RsaPublicJwk {
  kty: 'RSA';
  n: string;
  e: string;
  kid: string;
  alg: 'RS256';
  use: 'sig';
}

@ApiExcludeController()
@Controller({ path: '.well-known/jwks.json', version: VERSION_NEUTRAL })
export class JwksController {
  private jwk: RsaPublicJwk | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getJwk(): RsaPublicJwk {
    if (!this.jwk) {
      const jwtConfig = this.configService.get<JwtConfig>('jwt')!;
      const { publicKey } = loadRsaKeyPair(jwtConfig);
      const keyObject = createPublicKey(publicKey);
      const { kty, n, e } = keyObject.export({ format: 'jwk' }) as {
        kty: string;
        n: string;
        e: string;
      };
      // RFC 7638 thumbprint: SHA-256 over the canonical JSON of required
      // RSA public-key members, sorted lexicographically.
      const canonical = JSON.stringify({ e, kty, n });
      const kid = createHash('sha256').update(canonical).digest('base64url');
      this.jwk = { kty: 'RSA', n, e, kid, alg: 'RS256', use: 'sig' };
    }
    return this.jwk;
  }

  @Public()
  @Get()
  getJwks(): { keys: RsaPublicJwk[] } {
    return { keys: [this.getJwk()] };
  }
}
