import { ApiProperty } from '@nestjs/swagger';

export class AuthenticatedUserDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 'admin' }) username!: string;
  @ApiProperty({ example: 'admin@velytics.com' }) email!: string;
  @ApiProperty({ example: 'Admin' }) firstName!: string;
  @ApiProperty({ example: 'Velytics' }) lastName!: string;
  @ApiProperty({ type: [String], example: ['user:create', 'user:read'] })
  authorities!: string[];
}

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.signature',
  })
  accessToken!: string;

  @ApiProperty({ type: AuthenticatedUserDto })
  user!: AuthenticatedUserDto;

  @ApiProperty({
    description:
      'CSRF double-submit token. Echo it back as the X-CSRF-Token header on /auth/refresh and /auth/logout.',
    example: 'x1Y3z...==',
  })
  csrfToken!: string;
}

export class RefreshResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.signature',
  })
  accessToken!: string;
}

export class CsrfTokenResponseDto {
  @ApiProperty({
    description: 'CSRF double-submit token; also set as a non-httpOnly cookie.',
    example: 'x1Y3z...==',
  })
  csrfToken!: string;
}
