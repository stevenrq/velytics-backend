// @Throttle(...) below needs literal numbers at class-definition time, which
// runs before Nest's DI container (and ConfigService) exists. Load .env here
// directly so a local dev override of THROTTLE_AUTH_* is picked up too; in
// deployed environments the real env vars are already set before Node starts,
// and dotenv never overwrites an existing value, so this is a no-op there.
import 'dotenv/config';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireCsrf } from '../common/decorators/require-csrf.decorator';
import { ApiProblemResponses } from '../common/decorators/api-problem-responses.decorator';
import { AuthService } from './auth.service';
import { RefreshCookieFactory } from './refresh-cookie.factory';
import { CsrfCookieFactory } from './csrf-cookie.factory';
import { LoginDto } from './dto/login.dto';
import {
  CsrfTokenResponseDto,
  LoginResponseDto,
  RefreshResponseDto,
} from './dto/auth-response.dto';
import type { RequestUser } from './types/request-user.type';
import { MissingRefreshCookieException } from './exceptions/auth.exceptions';

const AUTH_THROTTLE = {
  default: {
    limit: parseInt(process.env.THROTTLE_AUTH_LIMIT ?? '10', 10),
    ttl: parseInt(process.env.THROTTLE_AUTH_TTL_SECONDS ?? '60', 10) * 1000,
  },
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshCookieFactory: RefreshCookieFactory,
    private readonly csrfCookieFactory: CsrfCookieFactory,
  ) {}

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in and issue an access token + refresh cookie.',
  })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiProblemResponses(401)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { response, rawRefreshToken } = await this.authService.login(
      body.username,
      body.password,
    );
    this.refreshCookieFactory.set(res, rawRefreshToken);
    const csrfToken = this.csrfCookieFactory.issue(res);
    return { ...response, csrfToken };
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Get('csrf-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Issues a fresh CSRF double-submit token (and matching cookie). Call this to resync after a page reload, before /auth/refresh or /auth/logout.',
  })
  @ApiOkResponse({ type: CsrfTokenResponseDto })
  csrfToken(@Res({ passthrough: true }) res: Response): CsrfTokenResponseDto {
    return { csrfToken: this.csrfCookieFactory.issue(res) };
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @RequireCsrf()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Rotate the refresh token (httpOnly refresh_token cookie) and issue a new access token. Does not require an Authorization header, but does require a matching X-CSRF-Token header.',
  })
  @ApiOkResponse({ type: RefreshResponseDto })
  @ApiProblemResponses(401)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponseDto> {
    const rawRefreshToken = req.cookies?.[
      this.refreshCookieFactory.cookieName
    ] as string | undefined;
    if (!rawRefreshToken) {
      throw new MissingRefreshCookieException();
    }

    const { accessToken, rawRefreshToken: newRawRefreshToken } =
      await this.authService.refresh(rawRefreshToken);
    this.refreshCookieFactory.set(res, newRawRefreshToken);
    return { accessToken };
  }

  @RequireCsrf()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Revoke the refresh token and the current access token, and clear the cookies.',
  })
  @ApiNoContentResponse({ description: 'Session closed successfully.' })
  @ApiProblemResponses(401)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    const rawRefreshToken = req.cookies?.[
      this.refreshCookieFactory.cookieName
    ] as string | undefined;
    await this.authService.logout(rawRefreshToken, user.jti, user.exp);
    this.refreshCookieFactory.clear(res);
    this.csrfCookieFactory.clear(res);
    // ASVS V14.3.1 — clears the backend origin's cookies/storage on logout.
    // Cannot reach the frontend SPA's own localStorage on a different domain.
    res.setHeader('Clear-Site-Data', '"cookies", "storage"');
  }
}
