import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ADMIN_CREDENTIALS, createTestApp } from './utils/test-app';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  /** Logs in and returns everything needed to call CSRF-protected routes. */
  async function loginWithCsrf() {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(ADMIN_CREDENTIALS)
      .expect(200);
    const [refreshCookie, csrfCookie] = res.headers['set-cookie'] as string[];
    return {
      accessToken: res.body.accessToken as string,
      csrfToken: res.body.csrfToken as string,
      cookie: `${refreshCookie}; ${csrfCookie}`,
    };
  }

  it('rejects login with wrong credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        username: ADMIN_CREDENTIALS.username,
        password: 'wrong-password',
      })
      .expect(401);
  });

  it('logs in and returns an access token, csrf token and refresh cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(ADMIN_CREDENTIALS)
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.csrfToken).toBeDefined();
    expect(res.body.user.username).toBe(ADMIN_CREDENTIALS.username);
    expect(res.headers['set-cookie']?.[0]).toMatch(/^refresh_token=/);
    expect(res.headers['set-cookie']?.[1]).toMatch(/^csrf_token=/);
  });

  it('rejects requests without a token', async () => {
    await request(app.getHttpServer()).get('/api/v1/users').expect(401);
  });

  it('GET /auth/csrf-token issues a fresh token and cookie', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/csrf-token')
      .expect(200);
    expect(res.body.csrfToken).toBeDefined();
    expect(res.headers['set-cookie']?.[0]).toMatch(/^csrf_token=/);
  });

  it('rejects /auth/refresh without an X-CSRF-Token header', async () => {
    const { cookie } = await loginWithCsrf();
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .expect(403);
  });

  it('rejects /auth/refresh when the header does not match the cookie', async () => {
    const { cookie } = await loginWithCsrf();
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .set('X-CSRF-Token', 'not-the-right-token')
      .expect(403);
  });

  it('rotates the refresh token and detects reuse of the old one', async () => {
    const { cookie: originalCookie, csrfToken } = await loginWithCsrf();

    const refreshRes = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', originalCookie)
      .set('X-CSRF-Token', csrfToken)
      .expect(200);
    expect(refreshRes.body.accessToken).toBeDefined();
    const rotatedRefreshCookie = refreshRes.headers['set-cookie'][0];
    expect(rotatedRefreshCookie).not.toBe(originalCookie);
    const rotatedCookie = `${rotatedRefreshCookie}; ${originalCookie
      .split('; ')
      .find((c) => c.startsWith('csrf_token='))}`;

    // Replaying the now-rotated-away original cookie must fail and revoke
    // the whole session (not just this token).
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', originalCookie)
      .set('X-CSRF-Token', csrfToken)
      .expect(401);

    // The successor issued by the first rotation is now revoked too.
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', rotatedCookie)
      .set('X-CSRF-Token', csrfToken)
      .expect(401);
  });

  it('logout revokes the refresh token and denylists the access token', async () => {
    const { accessToken, csrfToken, cookie } = await loginWithCsrf();

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', cookie)
      .set('X-CSRF-Token', csrfToken)
      .expect(204)
      .expect('Clear-Site-Data', '"cookies", "storage"');

    // The denylisted access token can no longer be used.
    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);

    // The revoked refresh token can no longer be rotated.
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .set('X-CSRF-Token', csrfToken)
      .expect(401);
  });

  it('rejects logout without an X-CSRF-Token header', async () => {
    const { accessToken, cookie } = await loginWithCsrf();
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', cookie)
      .expect(403);
  });

  it('rejects refresh once the account has been disabled', async () => {
    const admin = await loginWithCsrf();

    const suffix = Date.now().toString().slice(-7);
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        nationalId: suffix,
        firstName: 'Temp',
        lastName: 'User',
        email: `temp.${suffix}@velytics.local`,
        phoneNumber: `300${suffix}`,
        username: `tempdis${suffix.slice(-6)}`,
        password: 'Passw0rd1!',
      })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        username: createRes.body.username,
        password: 'Passw0rd1!',
      })
      .expect(200);
    const [refreshCookie, csrfCookie] = loginRes.headers[
      'set-cookie'
    ] as string[];
    const cookie = `${refreshCookie}; ${csrfCookie}`;
    const csrfToken = loginRes.body.csrfToken as string;

    await request(app.getHttpServer())
      .patch(`/api/v1/users/${createRes.body.id}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ enabled: false })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .set('X-CSRF-Token', csrfToken)
      .expect(401);

    await request(app.getHttpServer())
      .delete(`/api/v1/users/${createRes.body.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
  });

  it('exposes the RS256 public key as a JWK', async () => {
    const res = await request(app.getHttpServer())
      .get('/.well-known/jwks.json')
      .expect(200);
    expect(res.body.keys).toHaveLength(1);
    expect(res.body.keys[0].kty).toBe('RSA');
  });
});
