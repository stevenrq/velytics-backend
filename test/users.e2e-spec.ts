import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ADMIN_CREDENTIALS, createTestApp } from './utils/test-app';

describe('Users self-update guards (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let createdId: number;
  let selfToken: string;
  let updatedAt: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(ADMIN_CREDENTIALS)
      .expect(200);
    adminToken = login.body.accessToken;

    const suffix = Date.now().toString().slice(-7);
    const create = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nationalId: suffix,
        firstName: 'Self',
        lastName: 'Update',
        email: `self.update.${suffix}@velytics.local`,
        phoneNumber: `300${suffix}`,
        username: `selfup${suffix.slice(-6)}`,
        password: 'Passw0rd1!',
      })
      .expect(201);
    createdId = create.body.id;
    updatedAt = create.body.updatedAt;

    const selfLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: create.body.username, password: 'Passw0rd1!' })
      .expect(200);
    selfToken = selfLogin.body.accessToken;
  });

  afterAll(async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/users/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    await app.close();
  });

  it('allows a user to update their own basic profile fields', async () => {
    const response = await request(app.getHttpServer())
      .put(`/api/v1/users/${createdId}`)
      .set('Authorization', `Bearer ${selfToken}`)
      .send({ lastName: 'Updated' })
      .expect(200)
      .expect(({ body }) => expect(body.lastName).toBe('Updated'));
    updatedAt = response.body.updatedAt;
  });

  it('rejects a self-update that tries to change own roles', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/users/${createdId}`)
      .set('Authorization', `Bearer ${selfToken}`)
      .send({ roleNames: ['ADMIN'], expectedUpdatedAt: updatedAt })
      .expect(403);
  });

  it('rejects a self-update that tries to re-enable/disable its own account, bypassing PATCH /:id/status', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/users/${createdId}`)
      .set('Authorization', `Bearer ${selfToken}`)
      .send({ enabled: true })
      .expect(403);
  });

  it('rejects a password shorter than the ASVS minimum (8 chars) on create', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nationalId: '1112223334',
        firstName: 'Too',
        lastName: 'Short',
        email: 'too.short@velytics.local',
        phoneNumber: '3001112233',
        username: 'tooshortpw',
        password: 'short12',
      })
      .expect(400);
  });

  it('rejects a password longer than the ASVS/bcrypt maximum (72 chars) on create', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nationalId: '1112223335',
        firstName: 'Too',
        lastName: 'Long',
        email: 'too.long@velytics.local',
        phoneNumber: '3001112234',
        username: 'toolongpw',
        password: 'a'.repeat(73),
      })
      .expect(400);
  });

  it('no longer rejects an all-lowercase password lacking composition rules', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nationalId: '1112223336',
        firstName: 'Noco',
        lastName: 'Composition',
        email: 'no.composition@velytics.local',
        phoneNumber: '3001112235',
        username: 'nocomppw',
        password: 'alllowercasepassphrase',
      })
      .expect(201)
      .then(async ({ body }) => {
        await request(app.getHttpServer())
          .delete(`/api/v1/users/${body.id}`)
          .set('Authorization', `Bearer ${adminToken}`);
      });
  });

  describe('self-service password change requires the current password', () => {
    let pwUserId: number;
    let pwUsername: string;
    let pwSelfToken: string;

    beforeAll(async () => {
      const suffix = `${Date.now()}`.slice(-7);
      const create = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nationalId: `2${suffix}`,
          firstName: 'Pwc',
          lastName: 'Change',
          email: `pw.change.${suffix}@velytics.local`,
          phoneNumber: `300${suffix}`,
          username: `pwchg${suffix}`,
          password: 'InitialPassw0rd',
        })
        .expect(201);
      pwUserId = create.body.id;
      pwUsername = create.body.username;

      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ username: pwUsername, password: 'InitialPassw0rd' })
        .expect(200);
      pwSelfToken = login.body.accessToken;
    });

    afterAll(async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/users/${pwUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    it('rejects a self password change without currentPassword', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/users/${pwUserId}`)
        .set('Authorization', `Bearer ${pwSelfToken}`)
        .send({ password: 'BrandNewPassw0rd' })
        .expect(400);
    });

    it('rejects a self password change with a wrong currentPassword', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/users/${pwUserId}`)
        .set('Authorization', `Bearer ${pwSelfToken}`)
        .send({
          password: 'BrandNewPassw0rd',
          currentPassword: 'not-the-current-password',
        })
        .expect(401);
    });

    it('accepts a self password change with the correct currentPassword and allows login with it', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/users/${pwUserId}`)
        .set('Authorization', `Bearer ${pwSelfToken}`)
        .send({
          password: 'BrandNewPassw0rd',
          currentPassword: 'InitialPassw0rd',
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ username: pwUsername, password: 'BrandNewPassw0rd' })
        .expect(200);
    });
  });
});
